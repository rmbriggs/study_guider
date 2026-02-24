import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.config import get_settings
from app.db import get_db
from app.models.user import User
from app.models.guide import StudyGuide, GuideSource, StudyGuideOutput, GuideStatus
from app.models.course import Course, Professor, CourseAttachment, CourseTest, CourseAttachmentTest, CourseTestAnalysis, CourseAttachmentType
from app.schemas.guides import (
    StudyGuideResponse,
    StudyGuideListItem,
    CreateGuideResponse,
    CreateGuideFromBlockRequest,
    GuideOutputResponse,
    GuideSourceResponse,
    GuideOptionsResponse,
)
from app.api.deps import get_current_user
from app.services.file_parser import extract_text_from_file
from app.services.llm_service import generate_study_guide

router = APIRouter(prefix="/guides", tags=["guides"])
settings = get_settings()
MAX_SIZE = settings.max_file_size_mb * 1024 * 1024
MAX_FILES = settings.max_files_per_request
ALLOWED = settings.allowed_extensions


def _ensure_upload_dir():
    path = Path(settings.upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


@router.get("", response_model=list[StudyGuideListItem])
def list_my_guides(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    guides = db.query(StudyGuide).filter(StudyGuide.user_id == current_user.id).order_by(StudyGuide.created_at.desc()).all()
    return [
        StudyGuideListItem(
            id=g.id,
            title=g.title,
            course=getattr(g, "course", None) or "",
            professor_name=g.professor_name,
            status=g.status,
            created_at=g.created_at,
        )
        for g in guides
    ]


@router.get("/options", response_model=GuideOptionsResponse)
def get_guide_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return distinct courses and professor names from guides and from Course/Professor tables."""
    from sqlalchemy import distinct
    # Courses: from Course table (nickname) + distinct from guides
    guide_courses = {
        row[0] for row in
        db.query(distinct(StudyGuide.course)).filter(
            StudyGuide.user_id == current_user.id,
            StudyGuide.course != "",
        ).all()
        if row[0]
    }
    course_nicknames = {
        c.nickname for c in
        db.query(Course).filter(Course.user_id == current_user.id).all()
    }
    courses = sorted(guide_courses | course_nicknames)
    # Professors: from Professor table + distinct from guides
    guide_professors = {
        row[0] for row in
        db.query(distinct(StudyGuide.professor_name)).filter(
            StudyGuide.user_id == current_user.id,
            StudyGuide.professor_name != "",
        ).all()
        if row[0]
    }
    professor_names = {p.name for p in db.query(Professor).filter(Professor.user_id == current_user.id).all()}
    professors = sorted(guide_professors | professor_names)
    return GuideOptionsResponse(courses=courses, professors=professors)


@router.post("/from-block", response_model=CreateGuideResponse)
def create_guide_from_block(
    body: CreateGuideFromBlockRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a study guide from a course block's materials (no new file uploads)."""
    if not getattr(current_user, "email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address to create study guides.",
        )

    course = (
        db.query(Course)
        .filter(Course.id == body.course_id, Course.user_id == current_user.id)
        .first()
    )
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    professor_name = ""
    if course.professor_id:
        prof = db.query(Professor).filter(Professor.id == course.professor_id).first()
        if prof:
            professor_name = prof.name or ""

    # Get attachment IDs for this block: either linked to test_id, or uncategorized (no links)
    attachments = db.query(CourseAttachment).filter(
        CourseAttachment.course_id == body.course_id,
    ).all()
    att_ids = [a.id for a in attachments]
    if not att_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course has no materials. Add handouts or notes to the block first.",
        )

    links = (
        db.query(CourseAttachmentTest)
        .filter(CourseAttachmentTest.attachment_id.in_(att_ids))
        .all()
    )
    attachment_ids_by_test: dict[int | None, list[int]] = {}
    for link in links:
        attachment_ids_by_test.setdefault(link.test_id, []).append(link.attachment_id)
    # Uncategorized = attachments not in any link (or we treat test_id=None as "in uncategorized")
    uncategorized_att_ids = set(att_ids) - {aid for link in links for aid in [link.attachment_id]}

    if body.test_id is not None:
        block_att_ids = set(attachment_ids_by_test.get(body.test_id, []))
    else:
        block_att_ids = uncategorized_att_ids

    block_attachments = [a for a in attachments if a.id in block_att_ids]
    if not block_attachments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This block has no materials. Add handouts or notes first.",
        )

    # Build typed_sources from existing files (past_test, handout, note order)
    kind_order = {CourseAttachmentType.PAST_TEST: 0, CourseAttachmentType.HANDOUT: 1, CourseAttachmentType.NOTE: 2}
    block_attachments.sort(key=lambda a: (kind_order.get(a.attachment_kind, 99), a.id))
    typed_sources: list[tuple[str, str, str]] = []
    guide = StudyGuide(
        user_id=current_user.id,
        title=(body.title or "").strip() or "Untitled Guide",
        course=course.nickname or "",
        professor_name=professor_name,
        user_specs=None,
        status=GuideStatus.processing.value,
    )
    db.add(guide)
    db.commit()
    db.refresh(guide)

    try:
        for att in block_attachments:
            path = Path(att.file_path)
            if not path.exists():
                continue
            text = extract_text_from_file(path, att.file_type or "") or "(no text extracted)"
            source = GuideSource(
                guide_id=guide.id,
                file_name=att.file_name,
                file_type=att.file_type,
                file_path=str(path),
                extracted_text=text,
                material_type=att.attachment_kind,
            )
            db.add(source)
            typed_sources.append((att.attachment_kind, att.file_name, text))

        if not typed_sources:
            guide.status = GuideStatus.failed.value
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not read any files from the block.",
            )

        professor_profile = None
        if professor_name:
            prof = (
                db.query(Professor)
                .filter(Professor.user_id == current_user.id, Professor.name == professor_name)
                .first()
            )
            if prof:
                professor_profile = {
                    "name": prof.name,
                    "specialties": prof.specialties,
                    "description": prof.description,
                }

        api_key = settings.gemini_api_key
        block_analyses = []
        professor_analysis = None
        guide_course_str = course.nickname or ""
        if guide_course_str:
            course_obj = (
                db.query(Course)
                .filter(Course.user_id == current_user.id, Course.nickname == guide_course_str)
                .first()
            )
            if course_obj:
                from app.services.analysis_service import analyze_test_block
                tests = db.query(CourseTest).filter(CourseTest.course_id == course_obj.id).all()
                for test in tests:
                    link_rows = db.query(CourseAttachmentTest).filter(
                        CourseAttachmentTest.test_id == test.id,
                    ).all()
                    att_ids_t = [r.attachment_id for r in link_rows]
                    if not att_ids_t:
                        continue
                    atts = db.query(CourseAttachment).filter(
                        CourseAttachment.id.in_(att_ids_t),
                    ).all()
                    has_past_test = any(a.attachment_kind == CourseAttachmentType.PAST_TEST for a in atts)
                    has_handout = any(
                        a.attachment_kind in (CourseAttachmentType.HANDOUT, CourseAttachmentType.NOTE)
                        for a in atts
                    )
                    if not (has_past_test and has_handout):
                        continue
                    existing = db.query(CourseTestAnalysis).filter(
                        CourseTestAnalysis.test_id == test.id,
                    ).first()
                    if not existing:
                        try:
                            existing = analyze_test_block(test.id, db, api_key)
                        except Exception:
                            pass
                    if existing:
                        block_analyses.append({
                            "summary": existing.summary,
                            "high_signal_handouts": existing.high_signal_handouts,
                            "topic_frequency": existing.topic_frequency,
                            "question_formats": existing.question_formats,
                        })
                if course_obj.professor_id:
                    prof_obj = db.query(Professor).filter(
                        Professor.id == course_obj.professor_id,
                    ).first()
                    if prof_obj and prof_obj.analysis_profile:
                        professor_analysis = prof_obj.analysis_profile

        content, model_used = generate_study_guide(
            course=guide_course_str,
            professor_name=guide.professor_name,
            user_specs=guide.user_specs,
            typed_sources=typed_sources,
            professor_profile=professor_profile,
            api_key=api_key,
            block_analyses=block_analyses or None,
            professor_analysis=professor_analysis,
        )
        output = StudyGuideOutput(
            guide_id=guide.id,
            content=content,
            model_used=model_used,
        )
        db.add(output)
        guide.status = GuideStatus.completed.value
        db.commit()
        db.refresh(guide)
        db.refresh(output)
        return CreateGuideResponse(
            id=guide.id,
            title=guide.title,
            status=guide.status,
            output=GuideOutputResponse(
                id=output.id,
                content=output.content,
                model_used=output.model_used,
                created_at=output.created_at,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        guide.status = GuideStatus.failed.value
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/{guide_id}", response_model=StudyGuideResponse)
def get_guide(
    guide_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    guide = db.query(StudyGuide).filter(StudyGuide.id == guide_id, StudyGuide.user_id == current_user.id).first()
    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")
    out = None
    if guide.output:
        out = GuideOutputResponse(
            id=guide.output.id,
            content=guide.output.content,
            model_used=guide.output.model_used,
            created_at=guide.output.created_at,
        )
    return StudyGuideResponse(
        id=guide.id,
        user_id=guide.user_id,
        title=guide.title,
        course=getattr(guide, "course", "") or "",
        professor_name=guide.professor_name,
        user_specs=guide.user_specs,
        status=guide.status,
        created_at=guide.created_at,
        output=out,
        sources=[GuideSourceResponse(id=s.id, file_name=s.file_name, file_type=s.file_type) for s in guide.sources],
    )


@router.post("", response_model=CreateGuideResponse)
async def create_guide(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    title: str = Form("Untitled Guide"),
    course: str = Form(""),
    professor_name: str = Form(""),
    user_specs: str | None = Form(None),
    past_tests: list[UploadFile] = File(default=[]),
    handouts: list[UploadFile] = File(default=[]),
    study_guides: list[UploadFile] = File(default=[]),
    notes: list[UploadFile] = File(default=[]),
):
    if not getattr(current_user, "email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address to create study guides.",
        )

    # Pair each upload with its material type, past_tests first (highest priority)
    typed_uploads: list[tuple[UploadFile, str]] = (
        [(f, "past_test")   for f in past_tests   if f.filename] +
        [(f, "handout")     for f in handouts      if f.filename] +
        [(f, "note")        for f in notes         if f.filename] +
        [(f, "study_guide") for f in study_guides  if f.filename]
    )
    if len(typed_uploads) > MAX_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_FILES} files allowed",
        )

    # Look up the professor's full profile so it can be injected into the system prompt
    professor_profile: dict | None = None
    if professor_name:
        prof = (
            db.query(Professor)
            .filter(Professor.user_id == current_user.id, Professor.name == professor_name)
            .first()
        )
        if prof:
            professor_profile = {
                "name": prof.name,
                "specialties": prof.specialties,
                "description": prof.description,
            }

    upload_dir = _ensure_upload_dir()
    guide = StudyGuide(
        user_id=current_user.id,
        title=title or "Untitled Guide",
        course=course or "",
        professor_name=professor_name or "",
        user_specs=user_specs,
        status=GuideStatus.processing.value,
    )
    db.add(guide)
    db.commit()
    db.refresh(guide)

    # (material_type, label, text) — order matters: past_tests feed first into the prompt
    typed_sources: list[tuple[str, str, str]] = []
    saved_paths: list[Path] = []
    try:
        for f, material_type in typed_uploads:
            ext = Path(f.filename).suffix.lstrip(".").lower()
            if ext not in ALLOWED:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File type .{ext} not allowed. Allowed: {', '.join(ALLOWED)}",
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
            saved_paths.append(path)
            text = extract_text_from_file(path, ext)
            source = GuideSource(
                guide_id=guide.id,
                file_name=f.filename,
                file_type=ext,
                file_path=str(path),
                extracted_text=text,
                material_type=material_type,
            )
            db.add(source)
            db.commit()
            typed_sources.append((material_type, f.filename, text or "(no text extracted)"))

        api_key = settings.gemini_api_key

        # Collect test-handout analyses for this course (auto-analyzing missing ones)
        block_analyses: list[dict] = []
        professor_analysis: dict | None = None
        guide_course_str = getattr(guide, "course", "") or ""
        if guide_course_str:
            course_obj = db.query(Course).filter(
                Course.user_id == current_user.id,
                Course.nickname == guide_course_str,
            ).first()
            if course_obj:
                from app.services.analysis_service import analyze_test_block
                tests = db.query(CourseTest).filter(CourseTest.course_id == course_obj.id).all()
                for test in tests:
                    link_rows = db.query(CourseAttachmentTest).filter(
                        CourseAttachmentTest.test_id == test.id
                    ).all()
                    att_ids = [r.attachment_id for r in link_rows]
                    if not att_ids:
                        continue
                    atts = db.query(CourseAttachment).filter(
                        CourseAttachment.id.in_(att_ids)
                    ).all()
                    has_past_test = any(a.attachment_kind == CourseAttachmentType.PAST_TEST for a in atts)
                    has_handout = any(
                        a.attachment_kind in (CourseAttachmentType.HANDOUT, CourseAttachmentType.NOTE)
                        for a in atts
                    )
                    if not (has_past_test and has_handout):
                        continue
                    existing = db.query(CourseTestAnalysis).filter(
                        CourseTestAnalysis.test_id == test.id
                    ).first()
                    if not existing:
                        try:
                            existing = analyze_test_block(test.id, db, api_key)
                        except Exception:
                            pass
                    if existing:
                        block_analyses.append({
                            "summary": existing.summary,
                            "high_signal_handouts": existing.high_signal_handouts,
                            "topic_frequency": existing.topic_frequency,
                            "question_formats": existing.question_formats,
                        })
                if course_obj.professor_id:
                    prof_obj = db.query(Professor).filter(
                        Professor.id == course_obj.professor_id
                    ).first()
                    if prof_obj and prof_obj.analysis_profile:
                        professor_analysis = prof_obj.analysis_profile

        content, model_used = generate_study_guide(
            course=guide_course_str,
            professor_name=guide.professor_name,
            user_specs=guide.user_specs,
            typed_sources=typed_sources,
            professor_profile=professor_profile,
            api_key=api_key,
            block_analyses=block_analyses or None,
            professor_analysis=professor_analysis,
        )
        output = StudyGuideOutput(
            guide_id=guide.id,
            content=content,
            model_used=model_used,
        )
        db.add(output)
        guide.status = GuideStatus.completed.value
        db.commit()
        db.refresh(guide)
        db.refresh(output)
        return CreateGuideResponse(
            id=guide.id,
            title=guide.title,
            status=guide.status,
            output=GuideOutputResponse(
                id=output.id,
                content=output.content,
                model_used=output.model_used,
                created_at=output.created_at,
            ),
        )
    except HTTPException:
        for p in saved_paths:
            try:
                p.unlink(missing_ok=True)
            except Exception:
                pass
        guide.status = GuideStatus.failed.value
        db.commit()
        raise
    except Exception as e:
        for p in saved_paths:
            try:
                p.unlink(missing_ok=True)
            except Exception:
                pass
        guide.status = GuideStatus.failed.value
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
