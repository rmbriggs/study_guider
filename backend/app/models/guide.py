from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base
import enum


class GuideStatus(str, enum.Enum):
    processing = "processing"
    completed = "completed"
    failed = "failed"


class StudyGuide(Base):
    __tablename__ = "study_guides"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False, default="Untitled Guide")
    course = Column(String(255), nullable=False, default="")
    professor_name = Column(String(255), nullable=False, default="")
    user_specs = Column(Text, nullable=True)
    status = Column(String(32), nullable=False, default=GuideStatus.processing.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="study_guides")
    sources = relationship("GuideSource", back_populates="guide", cascade="all, delete-orphan")
    output = relationship("StudyGuideOutput", back_populates="guide", uselist=False, cascade="all, delete-orphan")


class GuideSource(Base):
    __tablename__ = "guide_sources"

    id = Column(Integer, primary_key=True, index=True)
    guide_id = Column(Integer, ForeignKey("study_guides.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(64), nullable=False)
    file_path = Column(String(512), nullable=True)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    guide = relationship("StudyGuide", back_populates="sources")


class StudyGuideOutput(Base):
    __tablename__ = "study_guide_outputs"

    id = Column(Integer, primary_key=True, index=True)
    guide_id = Column(Integer, ForeignKey("study_guides.id"), nullable=False)
    content = Column(Text, nullable=False)
    model_used = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    guide = relationship("StudyGuide", back_populates="output")
