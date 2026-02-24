import re
import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from app.config import get_settings, get_upload_base
from app.db import get_db
from app.models.user import User
from app.models.course import Professor, Course, CourseTest, CourseAttachment, CourseAttachmentTest, CourseAttachmentType, CourseTestAnalysis
from app.schemas.courses import (
    ProfessorResponse,
    ProfessorCreate,
    ProfessorUpdate,
    ProfessorQuizAnswersUpdate,
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
    CourseTestAnalysisResponse,
)
from app.api.deps import get_current_user
from app.services.file_parser import _resolve_file_path

router = APIRouter(prefix="/courses", tags=["courses"])
settings = get_settings()
MAX_SIZE = settings.max_file_size_mb * 1024 * 1024
ALLOWED = settings.allowed_extensions
SYLLABUS_SUBDIR = "syllabi"
COURSE_FILES_SUBDIR = "course_files"
MAX_COURSE_FILES = 10


def _ensure_upload_dir(subdir: str = SYLLABUS_SUBDIR):
    """Use canonical upload base (backend-relative) so paths are stable across runs."""
    path = get_upload_base() / subdir
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


@router.post("/professors/{professor_id}/quiz/generate", response_model=ProfessorResponse)
def generate_professor_quiz(
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
    api_key = getattr(settings, "gemini_api_key", None) or ""
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Study guide quiz generation is not configured (missing API key).",
        )
    from app.services.llm_service import generate_professor_quiz_questions
    try:
        questions = generate_professor_quiz_questions(
            professor_name=professor.name or "",
            specialties=professor.specialties,
            description=professor.description,
            api_key=api_key,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    quiz = {"questions": questions, "answers": {}}
    professor.study_guide_quiz = quiz
    db.commit()
    db.refresh(professor)
    return professor


@router.patch("/professors/{professor_id}/quiz/answers", response_model=ProfessorResponse)
def update_professor_quiz_answers(
    professor_id: int,
    body: ProfessorQuizAnswersUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    professor = db.query(Professor).filter(
        Professor.id == professor_id,
        Professor.user_id == current_user.id,
    ).first()
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professor not found")
    existing = professor.study_guide_quiz or {}
    questions = existing.get("questions") or []
    answers = dict(existing.get("answers") or {})
    for qid, text in (body.answers or {}).items():
        if isinstance(text, str) and qid:
            answers[str(qid).strip()] = text.strip()[:2000]
    professor.study_guide_quiz = {"questions": questions, "answers": answers}
    db.commit()
    db.refresh(professor)
    return professor


@router.delete("/professors/{professor_id}/quiz", response_model=ProfessorResponse)
def delete_professor_quiz(
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
    professor.study_guide_quiz = None
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
        base["allow_multiple_blocks"] = bool(getattr(a, "allow_multiple_blocks", 0))
        attachment_models.append(CourseAttachmentResponse(**base))

    # Fetch analyses for all test IDs in one query
    test_ids = [t.id for t in tests]
    analyses_by_test_id: dict[int, CourseTestAnalysis] = {}
    if test_ids:
        analyses = db.query(CourseTestAnalysis).filter(CourseTestAnalysis.test_id.in_(test_ids)).all()
        for a in analyses:
            analyses_by_test_id[a.test_id] = a

    test_responses: list[CourseTestResponse] = []
    for t in tests:
        analysis = analyses_by_test_id.get(t.id)
        test_responses.append(CourseTestResponse(
            id=t.id,
            course_id=t.course_id,
            name=t.name,
            sort_order=t.sort_order,
            is_analyzed=analysis is not None,
            analysis_summary=analysis.summary if analysis else None,
        ))

    return CourseMaterialsResponse(
        tests=test_responses,
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


@router.post("/{course_id}/tests/{test_id}/analyze", response_model=CourseTestAnalysisResponse)
def analyze_test(
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
    from app.services.analysis_service import analyze_test_block
    try:
        analysis = analyze_test_block(test_id, db, settings.gemini_api_key)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    return analysis


@router.get("/{course_id}/tests/{test_id}/analysis", response_model=CourseTestAnalysisResponse)
def get_test_analysis(
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
    analysis = db.query(CourseTestAnalysis).filter(CourseTestAnalysis.test_id == test_id).first()
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No analysis found for this test block")
    return analysis


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
        att.allow_multiple_blocks = 1 if body.allow_multiple_blocks else 0

    # When assignment to blocks changes, clear analysis for affected blocks so they are reanalyzed.
    old_link_rows = db.query(CourseAttachmentTest).filter(CourseAttachmentTest.attachment_id == att.id).all()
    old_test_ids = {r.test_id for r in old_link_rows}

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

        # Clear analysis for any block that gained or lost this file so the block is reanalyzed.
        new_test_ids = set(unique)
        affected_test_ids = old_test_ids | new_test_ids
        if affected_test_ids:
            db.query(CourseTestAnalysis).filter(CourseTestAnalysis.test_id.in_(affected_test_ids)).delete(synchronize_session=False)

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


@router.post("/{course_id}/attachments/{attachment_id}/duplicate", response_model=CourseAttachmentResponse)
def duplicate_attachment(
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
    existing_count = db.query(CourseAttachment).filter(CourseAttachment.course_id == course_id).count()
    if existing_count >= MAX_COURSE_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_COURSE_FILES} total files per course.",
        )
    copy_name = (att.file_name or "file").strip()
    if not copy_name.lower().startswith("copy of "):
        copy_name = f"Copy of {copy_name}"
    copy_name = copy_name[:255]
    link_rows = db.query(CourseAttachmentTest).filter(CourseAttachmentTest.attachment_id == att.id).all()
    test_ids = [r.test_id for r in link_rows] if link_rows else ([att.test_id] if att.test_id else [])
    if getattr(att, "file_content", None) is not None:
        new_att = CourseAttachment(
            course_id=course_id,
            test_id=test_ids[0] if test_ids else None,
            file_name=copy_name,
            file_type=att.file_type,
            file_path=att.file_path or copy_name,
            file_content=att.file_content,
            attachment_kind=att.attachment_kind,
            allow_multiple_blocks=0,
        )
    else:
        path = _resolve_file_path(att.file_path)
        if not path.is_file():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk")
        course_upload_dir = path.parent
        safe_name = f"{uuid.uuid4().hex}_{path.name}"[:200]
        new_path = course_upload_dir / safe_name
        shutil.copy2(path, new_path)
        new_att = CourseAttachment(
            course_id=course_id,
            test_id=test_ids[0] if test_ids else None,
            file_name=copy_name,
            file_type=att.file_type,
            file_path=str(new_path),
            attachment_kind=att.attachment_kind,
            allow_multiple_blocks=0,
        )
    db.add(new_att)
    db.flush()
    for tid in test_ids:
        db.add(CourseAttachmentTest(attachment_id=new_att.id, test_id=tid))
    db.commit()
    db.refresh(new_att)
    link_rows_new = db.query(CourseAttachmentTest).filter(CourseAttachmentTest.attachment_id == new_att.id).all()
    out_test_ids = sorted({r.test_id for r in link_rows_new})
    base = CourseAttachmentResponse.model_validate(new_att).model_dump()
    base["test_ids"] = out_test_ids
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
    # Clear analysis for every block that contained this file so those blocks are reanalyzed.
    link_rows = db.query(CourseAttachmentTest).filter(CourseAttachmentTest.attachment_id == att.id).all()
    affected_test_ids = [r.test_id for r in link_rows]
    if affected_test_ids:
        db.query(CourseTestAnalysis).filter(CourseTestAnalysis.test_id.in_(affected_test_ids)).delete(synchronize_session=False)
    path = _resolve_file_path(att.file_path)
    if path.is_file():
        path.unlink()
    # file_content is in DB only, no disk file to delete
    db.delete(att)
    db.commit()


@router.delete("/{course_id}/syllabus", status_code=status.HTTP_204_NO_CONTENT)
def delete_syllabus(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _get_course_or_404(course_id, current_user.id, db)
    has_db = getattr(course, "syllabus_file_data", None) is not None
    has_path = course.syllabus_file_path and _resolve_file_path(course.syllabus_file_path).is_file()
    if not has_db and not has_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No syllabus file")
    if has_path:
        path = _resolve_file_path(course.syllabus_file_path)
        if path.is_file():
            path.unlink()
    course.syllabus_file_path = None
    course.syllabus_file_data = None
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
    if getattr(att, "file_content", None) is not None:
        filename = (att.file_name or "file").replace('"', "'")
        return Response(
            content=att.file_content,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    path = _resolve_file_path(att.file_path)
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
    if getattr(course, "syllabus_file_data", None) is not None:
        filename = (course.syllabus_file_path or "syllabus").replace("\\", "/").split("/")[-1]
        if "_" in filename:
            filename = filename.split("_", 1)[-1]
        return Response(
            content=course.syllabus_file_data,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    if not course.syllabus_file_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No syllabus file")
    path = _resolve_file_path(course.syllabus_file_path)
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Syllabus file not found")
    filename = path.name
    if "_" in filename:
        filename = filename.split("_", 1)[-1]
    return FileResponse(path, filename=filename, media_type="application/octet-stream")


def _sanitize_filename(filename: str) -> str:
    """Strip path separators and Windows-invalid characters from a filename."""
    # Strip any path separators so only the base name remains
    filename = filename.replace("\\", "/").split("/")[-1]
    # Replace characters invalid on Windows filesystems
    filename = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', filename)
    return filename.strip() or "file"


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
    max_order = db.query(CourseTest).filter(CourseTest.course_id == course_id).count()
    sort_order = max_order
    added = 0
    skipped_ext: list[str] = []
    skipped_size: list[str] = []
    for upload_file, kind in all_extra:
        ext = Path(upload_file.filename).suffix.lstrip(".").lower()
        if ext not in ALLOWED:
            skipped_ext.append(upload_file.filename)
            continue
        content = await upload_file.read()
        if len(content) > MAX_SIZE:
            skipped_size.append(upload_file.filename)
            continue
        clean_name = _sanitize_filename(upload_file.filename)
        test_id = None
        if kind == CourseAttachmentType.PAST_TEST:
            section_name = (Path(clean_name).stem or "Past test").strip()[:255]
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
            file_path=clean_name,
            file_content=content,
            attachment_kind=kind,
        )
        db.add(att)
        db.flush()
        if test_id is not None:
            db.add(CourseAttachmentTest(attachment_id=att.id, test_id=test_id))
        added += 1
    db.commit()
    result: dict = {"ok": True, "added": added}
    if skipped_ext:
        result["skipped_unsupported"] = skipped_ext
    if skipped_size:
        result["skipped_too_large"] = skipped_size
    if added == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"No files were saved. "
                + (f"Unsupported type: {', '.join(skipped_ext)}. " if skipped_ext else "")
                + (f"Too large (>{settings.max_file_size_mb} MB): {', '.join(skipped_size)}." if skipped_size else "")
            ).strip(),
        )
    return result


def _professor_name(course: Course) -> str | None:
    """Safely get professor name; returns None if missing or on any access error."""
    try:
        return course.professor.name if course.professor else None
    except Exception:
        return None


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
            professor_name=_professor_name(c),
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
        professor_name=_professor_name(course),
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
    syllabus_data = None
    if syllabus and syllabus.filename:
        ext = Path(syllabus.filename or "").suffix.lstrip(".").lower()
        if ext not in ALLOWED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Syllabus file type .{ext} not allowed. Allowed: {', '.join(sorted(ALLOWED)).upper()}",
            )
        content = await syllabus.read()
        if len(content) > MAX_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Syllabus file exceeds {settings.max_file_size_mb} MB",
            )
        syllabus_path = _sanitize_filename(syllabus.filename)
        syllabus_data = content

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
        syllabus_file_data=syllabus_data,
        personal_description=(personal_description or "").strip() or None,
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    sort_order = 0
    for upload_file, kind in all_extra:
        ext = Path(upload_file.filename).suffix.lstrip(".").lower()
        if ext not in ALLOWED:
            continue
        content = await upload_file.read()
        if len(content) > MAX_SIZE:
            continue
        clean_name = _sanitize_filename(upload_file.filename)
        test_id = None
        if kind == CourseAttachmentType.PAST_TEST:
            section_name = (Path(clean_name).stem or "Past test").strip()[:255]
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
            file_path=clean_name,
            file_content=content,
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
