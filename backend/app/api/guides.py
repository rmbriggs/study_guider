import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.config import get_settings
from app.db import get_db
from app.models.user import User
from app.models.guide import StudyGuide, GuideSource, StudyGuideOutput, GuideStatus
from app.schemas.guides import (
    StudyGuideResponse,
    StudyGuideListItem,
    CreateGuideResponse,
    GuideOutputResponse,
    GuideSourceResponse,
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
    return guides


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
    professor_name: str = Form(""),
    user_specs: str | None = Form(None),
    files: list[UploadFile] = File(default=[]),
):
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_FILES} files allowed",
        )
    upload_dir = _ensure_upload_dir()
    guide = StudyGuide(
        user_id=current_user.id,
        title=title or "Untitled Guide",
        professor_name=professor_name or "",
        user_specs=user_specs,
        status=GuideStatus.processing.value,
    )
    db.add(guide)
    db.commit()
    db.refresh(guide)
    source_sections: list[tuple[str, str]] = []
    saved_paths: list[Path] = []
    try:
        for f in files:
            if not f.filename:
                continue
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
            )
            db.add(source)
            db.commit()
            source_sections.append((f.filename, text or "(no text extracted)"))
        api_key = settings.gemini_api_key
        content, model_used = generate_study_guide(
            professor_name=guide.professor_name,
            user_specs=guide.user_specs,
            source_sections=source_sections,
            api_key=api_key,
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
