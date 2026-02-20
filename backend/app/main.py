from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import engine, Base
from app import models  # noqa: F401 - ensure all models registered for create_all
from app.api.auth import router as auth_router
from app.api.guides import router as guides_router
from app.api.courses import router as courses_router
from app.config import get_settings

settings = get_settings()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CourseMind API", version="1.0.0")
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


@app.get("/api/health")
def health():
    return {"status": "ok"}
