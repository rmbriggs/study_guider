import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.config import get_settings
from app.db import get_db
from app.models.user import User
from app.models.course import Professor, Course, CourseTest, CourseAttachment, CourseAttachmentTest, CourseAttachmentType
from app.schemas.courses import (
    ProfessorResponse,
    ProfessorCreate,
    ProfessorUpdate,
    CourseListItem,
    CourseResponse,
    CourseCreateResponse,
    CourseUpdate,
    CourseTestResponse,
    CourseTestCreate,
    CourseTestUpdate,
    CourseAttachmentResponse,
    CourseMaterialsResponse,
    AttachmentUpdate,
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/courses", tags=["courses"])
settings = get_settings()
MAX_SIZE = settings.max_file_size_mb * 1024 * 1024
ALLOWED = settings.allowed_extensions
SYLLABUS_SUBDIR = "syllabi"
COURSE_FILES_SUBDIR = "course_files"
MAX_COURSE_FILES = 10


def _ensure_upload_dir(subdir: str = SYLLABUS_SUBDIR):
    path = Path(settings.upload_dir) / subdir
    path.mkdir(parents=True, exist_ok=True)
    return path


# ---- Professors ----
@router.get("/professors", response_model=list[ProfessorResponse])
def list_my_professors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    professors = db.query(Professor).filter(Professor.user_id == current_user.id).order_by(Professor.name).all()
    return professors


@router.post("/professors", response_model=ProfessorResponse)
def create_professor(
    body: ProfessorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name is required")
    professor = Professor(
        user_id=current_user.id,
        name=name,
        specialties=(body.specialties or "").strip() or None,
        description=(body.description or "").strip() or None,
    )
    db.add(professor)
    db.commit()
    db.refresh(professor)
    return professor


@router.get("/professors/{professor_id}", response_model=ProfessorResponse)
def get_professor(
    professor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    professor = db.query(Professor).filter(
        Professor.id == professor_id,
        Professor.user_id == current_user.id,
    ).first()
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professor not found")
    return professor


@router.patch("/professors/{professor_id}", response_model=ProfessorResponse)
def update_professor(
    professor_id: int,
    body: ProfessorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    professor = db.query(Professor).filter(
        Professor.id == professor_id,
        Professor.user_id == current_user.id,
    ).first()
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professor not found")
    if body.name is not None:
        name = (body.name or "").strip()
        if not name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name is required")
        professor.name = name
    if body.specialties is not None:
        professor.specialties = (body.specialties or "").strip() or None
    if body.description is not None:
        professor.description = (body.description or "").strip() or None
    db.commit()
    db.refresh(professor)
    return professor


# ---- Courses ----
def _get_course_or_404(course_id: int, user_id: int, db: Session) -> Course:
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == user_id,
    ).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


@router.get("/{course_id}/materials", response_model=CourseMaterialsResponse)
def get_course_materials(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _get_course_or_404(course_id, current_user.id, db)
    tests = db.query(CourseTest).filter(CourseTest.course_id == course_id).order_by(CourseTest.sort_order, CourseTest.name).all()
    attachments = db.query(CourseAttachment).filter(CourseAttachment.course_id == course_id).all()
    att_ids = [a.id for a in attachments]
    links = (
        db.query(CourseAttachmentTest)
        .join(CourseTest, CourseAttachmentTest.test_id == CourseTest.id)
        .filter(CourseTest.course_id == course_id)
        .filter(CourseAttachmentTest.attachment_id.in_(att_ids) if att_ids else True)
        .all()
    )
    test_ids_by_attachment: dict[int, list[int]] = {}
    for l in links:
        test_ids_by_attachment.setdefault(l.attachment_id, []).append(l.test_id)

    attachment_models: list[CourseAttachmentResponse] = []
    for a in attachments:
        base = CourseAttachmentResponse.model_validate(a).model_dump()
        ids = set(test_ids_by_attachment.get(a.id, []))
        # Backward-compat: if the junction table isn't backfilled yet, fall back to legacy test_id.
        if not ids and a.test_id is not None:
            ids.add(a.test_id)
        base["test_ids"] = sorted(ids)
        base["allow_multiple_blocks"] = getattr(a, "allow_multiple_blocks", False)
        attachment_models.append(CourseAttachmentResponse(**base))

    return CourseMaterialsResponse(
        tests=[CourseTestResponse.model_validate(t) for t in tests],
        attachments=attachment_models,
    )


@router.post("/{course_id}/tests", response_model=CourseTestResponse)
def create_test(
    course_id: int,
    body: CourseTestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _get_course_or_404(course_id, current_user.id, db)
    name = (body.name or "").strip() or "Untitled section"
    max_order = db.query(CourseTest).filter(CourseTest.course_id == course_id).count()
    sort_order = body.sort_order if body.sort_order is not None else max_order
    test = CourseTest(course_id=course_id, name=name, sort_order=sort_order)
    db.add(test)
    db.commit()
    db.refresh(test)
    return test


@router.patch("/{course_id}/tests/{test_id}", response_model=CourseTestResponse)
def update_test(
    course_id: int,
    test_id: int,
    body: CourseTestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_course_or_404(course_id, current_user.id, db)
    test = db.query(CourseTest).filter(
        CourseTest.id == test_id,
        CourseTest.course_id == course_id,
    ).first()
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test section not found")
    if body.name is not None:
        test.name = (body.name or "").strip() or test.name
    if body.sort_order is not None:
        test.sort_order = body.sort_order
    db.commit()
    db.refresh(test)
    return test


@router.delete("/{course_id}/tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test(
    course_id: int,
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_course_or_404(course_id, current_user.id, db)
    test = db.query(CourseTest).filter(
        CourseTest.id == test_id,
        CourseTest.course_id == course_id,
    ).first()
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test section not found")
    # Legacy single-assignment: move attachments to Uncategorized.
    for att in test.attachments:
        att.test_id = None

    # Multi-assignment: remove this test from any attachments assigned to it.
    db.query(CourseAttachmentTest).filter(CourseAttachmentTest.test_id == test_id).delete(synchronize_session=False)
    db.delete(test)
    db.commit()


@router.patch("/{course_id}/attachments/{attachment_id}", response_model=CourseAttachmentResponse)
def update_attachment(
    course_id: int,
    attachment_id: int,
    body: AttachmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_course_or_404(course_id, current_user.id, db)
    att = db.query(CourseAttachment).filter(
        CourseAttachment.id == attachment_id,
        CourseAttachment.course_id == course_id,
    ).first()
    if not att:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")

    if body.file_name is not None:
        name = (body.file_name or "").strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File name cannot be empty",
            )
        att.file_name = name[:255]

    if body.allow_multiple_blocks is not None:
        att.allow_multiple_blocks = body.allow_multiple_blocks

    def set_attachment_test_ids(test_ids: list[int]):
        unique: list[int] = []
        seen: set[int] = set()
        for tid in test_ids:
            if tid in seen:
                continue
            unique.append(tid)
            seen.add(tid)

        if unique:
            rows = db.query(CourseTest).filter(
                CourseTest.course_id == course_id,
                CourseTest.id.in_(unique),
            ).all()
            if len(rows) != len(unique):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test section not found")

        db.query(CourseAttachmentTest).filter(CourseAttachmentTest.attachment_id == att.id).delete(synchronize_session=False)
        for tid in unique:
            db.add(CourseAttachmentTest(attachment_id=att.id, test_id=tid))

        # Keep legacy column aligned for now (first assigned test).
        att.test_id = unique[0] if unique else None

    if body.test_ids is not None:
        set_attachment_test_ids(body.test_ids or [])
    elif body.test_id is not None:
        if body.test_id is None or body.test_id == 0:
            set_attachment_test_ids([])
        else:
            set_attachment_test_ids([body.test_id])

    db.commit()
    db.refresh(att)
    link_rows = db.query(CourseAttachmentTest).filter(CourseAttachmentTest.attachment_id == att.id).all()
    test_ids = sorted({r.test_id for r in link_rows} | ({att.test_id} if att.test_id is not None else set()))
    base = CourseAttachmentResponse.model_validate(att).model_dump()
    base["test_ids"] = test_ids
    return CourseAttachmentResponse(**base)


@router.delete("/{course_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    course_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_course_or_404(course_id, current_user.id, db)
    att = db.query(CourseAttachment).filter(
        CourseAttachment.id == attachment_id,
        CourseAttachment.course_id == course_id,
    ).first()
    if not att:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")
    path = Path(att.file_path)
    if path.is_file():
        path.unlink()
    db.delete(att)
    db.commit()


@router.delete("/{course_id}/syllabus", status_code=status.HTTP_204_NO_CONTENT)
def delete_syllabus(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _get_course_or_404(course_id, current_user.id, db)
    if not course.syllabus_file_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No syllabus file")
    path = Path(course.syllabus_file_path)
    if path.is_file():
        path.unlink()
    course.syllabus_file_path = None
    db.commit()


@router.get("/{course_id}/attachments/{attachment_id}/file")
def get_attachment_file(
    course_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_course_or_404(course_id, current_user.id, db)
    att = db.query(CourseAttachment).filter(
        CourseAttachment.id == attachment_id,
        CourseAttachment.course_id == course_id,
    ).first()
    if not att:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")
    path = Path(att.file_path)
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return FileResponse(path, filename=att.file_name, media_type="application/octet-stream")


@router.get("/{course_id}/syllabus/file")
def get_syllabus_file(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _get_course_or_404(course_id, current_user.id, db)
    if not course.syllabus_file_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No syllabus file")
    path = Path(course.syllabus_file_path)
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Syllabus file not found")
    filename = path.name
    if "_" in filename:
        filename = filename.split("_", 1)[-1]
    return FileResponse(path, filename=filename, media_type="application/octet-stream")


@router.post("/{course_id}/files")
async def add_course_files(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    handouts: list[UploadFile] = File(default=[]),
    past_tests: list[UploadFile] = File(default=[]),
    notes: list[UploadFile] = File(default=[]),
):
    course = _get_course_or_404(course_id, current_user.id, db)
    all_extra = [
        (h, CourseAttachmentType.HANDOUT) for h in (handouts or []) if h and h.filename
    ] + [
        (p, CourseAttachmentType.PAST_TEST) for p in (past_tests or []) if p and p.filename
    ] + [
        (n, CourseAttachmentType.NOTE) for n in (notes or []) if n and n.filename
    ]
    if not all_extra:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided. Add at least one file (handout, past test, or note).",
        )
    existing_count = db.query(CourseAttachment).filter(CourseAttachment.course_id == course_id).count()
    if existing_count + len(all_extra) > MAX_COURSE_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_COURSE_FILES} total files per course. You have {existing_count}, adding {len(all_extra)} would exceed the limit.",
        )
    course_upload_dir = _ensure_upload_dir(COURSE_FILES_SUBDIR)
    max_order = db.query(CourseTest).filter(CourseTest.course_id == course_id).count()
    sort_order = max_order
    for upload_file, kind in all_extra:
        ext = Path(upload_file.filename).suffix.lstrip(".").lower()
        if ext not in ALLOWED:
            continue
        content = await upload_file.read()
        if len(content) > MAX_SIZE:
            continue
        safe_name = f"{uuid.uuid4().hex}_{upload_file.filename}"[:200]
        path = course_upload_dir / safe_name
        path.write_bytes(content)
        test_id = None
        if kind == CourseAttachmentType.PAST_TEST:
            section_name = (Path(upload_file.filename).stem or "Past test").strip()[:255]
            course_test = CourseTest(
                course_id=course.id,
                name=section_name or "Past test",
                sort_order=sort_order,
            )
            db.add(course_test)
            db.flush()
            test_id = course_test.id
            sort_order += 1
        att = CourseAttachment(
            course_id=course.id,
            test_id=test_id,
            file_name=upload_file.filename,
            file_type=ext,
            file_path=str(path),
            attachment_kind=kind,
        )
        db.add(att)
        db.flush()
        if test_id is not None:
            db.add(CourseAttachmentTest(attachment_id=att.id, test_id=test_id))
    db.commit()
    return {"ok": True, "added": len(all_extra)}


@router.get("", response_model=list[CourseListItem])
def list_my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    courses = db.query(Course).filter(Course.user_id == current_user.id).order_by(Course.nickname).all()
    return [
        CourseListItem(
            id=c.id,
            official_name=c.official_name,
            nickname=c.nickname,
            professor_name=c.professor.name if c.professor else None,
        )
        for c in courses
    ]


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _get_course_or_404(course_id, current_user.id, db)
    return CourseResponse(
        id=course.id,
        official_name=course.official_name,
        nickname=course.nickname,
        professor_id=course.professor_id,
        professor_name=course.professor.name if course.professor else None,
        syllabus_file_path=course.syllabus_file_path,
        personal_description=course.personal_description,
        created_at=course.created_at,
    )


@router.patch("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    body: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == current_user.id,
    ).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if body.official_name is not None:
        official = (body.official_name or "").strip()
        if not official:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Official course name is required")
        course.official_name = official
    if body.nickname is not None:
        nick = (body.nickname or "").strip()
        if not nick:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nickname is required")
        course.nickname = nick
    if "professor_id" in body.model_dump(exclude_unset=True):
        if body.professor_id is None or body.professor_id == 0:
            course.professor_id = None
        else:
            professor = db.query(Professor).filter(
                Professor.id == body.professor_id,
                Professor.user_id == current_user.id,
            ).first()
            if not professor:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professor not found")
            course.professor_id = professor.id
    if body.personal_description is not None:
        course.personal_description = (body.personal_description or "").strip() or None
    db.commit()
    db.refresh(course)
    if course.professor:
        db.refresh(course.professor)
    return CourseResponse(
        id=course.id,
        official_name=course.official_name,
        nickname=course.nickname,
        professor_id=course.professor_id,
        professor_name=course.professor.name if course.professor else None,
        syllabus_file_path=course.syllabus_file_path,
        personal_description=course.personal_description,
        created_at=course.created_at,
    )


async def _save_upload(f: UploadFile, upload_dir: Path) -> str:
    ext = Path(f.filename or "").suffix.lstrip(".").lower()
    if ext not in ALLOWED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type .{ext} not allowed. Allowed: {', '.join(sorted(ALLOWED)).upper()}",
        )
    content = await f.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File {f.filename} exceeds {settings.max_file_size_mb} MB",
        )
    safe_name = f"{uuid.uuid4().hex}_{f.filename}"[:200]
    path = upload_dir / safe_name
    path.write_bytes(content)
    return str(path)


@router.post("", response_model=CourseCreateResponse)
async def create_course(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    official_name: str = Form(...),
    nickname: str = Form(...),
    professor_id: int | None = Form(None),
    personal_description: str | None = Form(None),
    syllabus: UploadFile | None = File(None),
    handouts: list[UploadFile] = File(default=[]),
    past_tests: list[UploadFile] = File(default=[]),
    notes: list[UploadFile] = File(default=[]),
):
    official_name = (official_name or "").strip()
    nickname = (nickname or "").strip()
    if not official_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Official course name is required")
    if not nickname:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nickname is required")

    professor = None
    if professor_id is not None:
        professor = db.query(Professor).filter(
            Professor.id == professor_id,
            Professor.user_id == current_user.id,
        ).first()
        if not professor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professor not found")

    syllabus_path = None
    if syllabus and syllabus.filename:
        upload_dir = _ensure_upload_dir(SYLLABUS_SUBDIR)
        syllabus_path = await _save_upload(syllabus, upload_dir)

    all_extra = [
        (h, CourseAttachmentType.HANDOUT) for h in (handouts or []) if h and h.filename
    ] + [
        (p, CourseAttachmentType.PAST_TEST) for p in (past_tests or []) if p and p.filename
    ] + [
        (n, CourseAttachmentType.NOTE) for n in (notes or []) if n and n.filename
    ]
    if len(all_extra) > MAX_COURSE_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_COURSE_FILES} total files for handouts, past tests, and notes",
        )

    course = Course(
        user_id=current_user.id,
        official_name=official_name,
        nickname=nickname,
        professor_id=professor.id if professor else None,
        syllabus_file_path=syllabus_path,
        personal_description=(personal_description or "").strip() or None,
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    course_upload_dir = _ensure_upload_dir(COURSE_FILES_SUBDIR)
    sort_order = 0
    for upload_file, kind in all_extra:
        ext = Path(upload_file.filename).suffix.lstrip(".").lower()
        if ext not in ALLOWED:
            continue
        content = await upload_file.read()
        if len(content) > MAX_SIZE:
            continue
        safe_name = f"{uuid.uuid4().hex}_{upload_file.filename}"[:200]
        path = course_upload_dir / safe_name
        path.write_bytes(content)
        test_id = None
        if kind == CourseAttachmentType.PAST_TEST:
            section_name = (Path(upload_file.filename).stem or "Past test").strip()[:255]
            course_test = CourseTest(
                course_id=course.id,
                name=section_name or "Past test",
                sort_order=sort_order,
            )
            db.add(course_test)
            db.flush()
            test_id = course_test.id
            sort_order += 1
        att = CourseAttachment(
            course_id=course.id,
            test_id=test_id,
            file_name=upload_file.filename,
            file_type=ext,
            file_path=str(path),
            attachment_kind=kind,
        )
        db.add(att)
        db.flush()
        if test_id is not None:
            db.add(CourseAttachmentTest(attachment_id=att.id, test_id=test_id))
    db.commit()
    if course.professor:
        db.refresh(course.professor)
    return CourseCreateResponse(
        id=course.id,
        official_name=course.official_name,
        nickname=course.nickname,
        professor_name=course.professor.name if course.professor else None,
    )
