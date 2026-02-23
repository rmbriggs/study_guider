from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base


class Professor(Base):
    __tablename__ = "professors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    specialties = Column(Text, nullable=True)
    description = Column(Text, nullable=True)

    user = relationship("User", backref="professors")
    courses = relationship("Course", back_populates="professor")


class CourseAttachmentType:
    HANDOUT = "handout"
    PAST_TEST = "past_test"
    NOTE = "note"


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    official_name = Column(String(255), nullable=False)
    nickname = Column(String(255), nullable=False)
    professor_id = Column(Integer, ForeignKey("professors.id"), nullable=True)
    syllabus_file_path = Column(String(512), nullable=True)
    personal_description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="courses")
    professor = relationship("Professor", back_populates="courses")
    attachments = relationship("CourseAttachment", back_populates="course", cascade="all, delete-orphan")
    tests = relationship("CourseTest", back_populates="course", cascade="all, delete-orphan", order_by="CourseTest.sort_order")


class CourseTest(Base):
    __tablename__ = "course_tests"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    name = Column(String(255), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)

    course = relationship("Course", back_populates="tests")
    attachments = relationship("CourseAttachment", back_populates="test")
    attachment_links = relationship("CourseAttachmentTest", back_populates="test", cascade="all, delete-orphan")


class CourseAttachmentTest(Base):
    __tablename__ = "course_attachment_tests"

    attachment_id = Column(Integer, ForeignKey("course_attachments.id"), primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("course_tests.id"), primary_key=True, index=True)

    attachment = relationship("CourseAttachment", back_populates="test_links")
    test = relationship("CourseTest", back_populates="attachment_links")


class CourseAttachment(Base):
    __tablename__ = "course_attachments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    test_id = Column(Integer, ForeignKey("course_tests.id"), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(64), nullable=False)  # pdf, txt
    file_path = Column(String(512), nullable=False)
    attachment_kind = Column(String(32), nullable=False)  # handout, past_test, note
    allow_multiple_blocks = Column(Boolean, nullable=False, default=False)

    course = relationship("Course", back_populates="attachments")
    test = relationship("CourseTest", back_populates="attachments")
    test_links = relationship("CourseAttachmentTest", back_populates="attachment", cascade="all, delete-orphan")
