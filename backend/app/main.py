from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.db import engine, Base, SessionLocal
from app import models  # noqa: F401 - ensure all models registered for create_all
from app.api.auth import router as auth_router
from app.api.guides import router as guides_router
from app.api.courses import router as courses_router
from app.api.admin import router as admin_router
from app.config import get_settings
from app.models.user import User

settings = get_settings()
Base.metadata.create_all(bind=engine)


def _ensure_allow_multiple_blocks_column():
    """Add course_attachments.allow_multiple_blocks if missing (e.g. after deploy)."""
    try:
        with engine.connect() as conn:
            inspector = inspect(engine)
            if "course_attachments" not in inspector.get_table_names():
                return
            columns = [c["name"] for c in inspector.get_columns("course_attachments")]
            if "allow_multiple_blocks" in columns:
                return
            conn.execute(text(
                "ALTER TABLE course_attachments ADD COLUMN allow_multiple_blocks INTEGER NOT NULL DEFAULT 0"
            ))
            conn.commit()
    except Exception:
        pass


def _ensure_analysis_columns():
    """Add professors.analysis_profile and professors.study_guide_quiz if missing."""
    try:
        with engine.connect() as conn:
            inspector = inspect(engine)
            if "professors" not in inspector.get_table_names():
                return
            columns = [c["name"] for c in inspector.get_columns("professors")]
            if "analysis_profile" not in columns:
                conn.execute(text("ALTER TABLE professors ADD COLUMN analysis_profile JSON"))
                conn.commit()
            if "study_guide_quiz" not in columns:
                conn.execute(text("ALTER TABLE professors ADD COLUMN study_guide_quiz JSON"))
                conn.commit()
    except Exception:
        pass


def _ensure_guide_block_columns():
    """Add study_guides.course_id and study_guides.test_id if missing (block–guide link)."""
    try:
        with engine.connect() as conn:
            inspector = inspect(engine)
            if "study_guides" not in inspector.get_table_names():
                return
            columns = [c["name"] for c in inspector.get_columns("study_guides")]
            if "course_id" not in columns:
                conn.execute(text(
                    "ALTER TABLE study_guides ADD COLUMN course_id INTEGER REFERENCES courses(id)"
                ))
                conn.commit()
            if "test_id" not in columns:
                conn.execute(text(
                    "ALTER TABLE study_guides ADD COLUMN test_id INTEGER REFERENCES course_tests(id)"
                ))
                conn.commit()
    except Exception:
        pass


def _sync_admin_users():
    """Set is_admin=True for user IDs listed in ADMIN_USER_IDS (comma-separated)."""
    ids_str = (settings.admin_user_ids or "").strip()
    if not ids_str:
        return
    admin_ids = []
    for s in ids_str.split(","):
        s = s.strip()
        if s and s.isdigit():
            admin_ids.append(int(s))
    if not admin_ids:
        return
    db = SessionLocal()
    try:
        db.query(User).filter(User.id.in_(admin_ids)).update(
            {User.is_admin: True}, synchronize_session=False
        )
        db.commit()
    finally:
        db.close()


app = FastAPI(title="CourseMind API", version="1.0.0")


@app.on_event("startup")
def on_startup():
    _ensure_allow_multiple_blocks_column()
    _ensure_analysis_columns()
    _ensure_guide_block_columns()
    _sync_admin_users()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://localhost:5173",
        "https://127.0.0.1:5173",
        "https://www.coursemind.app",
        "https://coursemind.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router, prefix="/api")
app.include_router(guides_router, prefix="/api")
app.include_router(courses_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
