import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.config import get_settings
from app.db import get_db
from app.models.user import User
from app.models.course import Professor, Course, CourseAttachment, CourseAttachmentType
from app.schemas.courses import (
    ProfessorResponse,
    ProfessorCreate,
    CourseListItem,
    CourseCreateResponse,
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


# ---- Courses ----
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


async def _save_upload(f: UploadFile, upload_dir: Path) -> str:
    ext = Path(f.filename or "").suffix.lstrip(".").lower()
    if ext not in ALLOWED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type .{ext} not allowed. Allowed: PDF, TXT",
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
        att = CourseAttachment(
            course_id=course.id,
            file_name=upload_file.filename,
            file_type=ext,
            file_path=str(path),
            attachment_kind=kind,
        )
        db.add(att)
    db.commit()
    if course.professor:
        db.refresh(course.professor)
    return CourseCreateResponse(
        id=course.id,
        official_name=course.official_name,
        nickname=course.nickname,
        professor_name=course.professor.name if course.professor else None,
    )
