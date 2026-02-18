from datetime import datetime
from pydantic import BaseModel


class ProfessorResponse(BaseModel):
    id: int
    name: str
    specialties: str | None = None
    description: str | None = None

    class Config:
        from_attributes = True


class ProfessorCreate(BaseModel):
    name: str
    specialties: str | None = None
    description: str | None = None


class CourseResponse(BaseModel):
    id: int
    official_name: str
    nickname: str
    professor_id: int | None
    professor_name: str | None = None
    syllabus_file_path: str | None
    personal_description: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class CourseListItem(BaseModel):
    """For dropdowns: display nickname, value can be nickname or id."""
    id: int
    official_name: str
    nickname: str
    professor_name: str | None

    class Config:
        from_attributes = True


class CourseCreateResponse(BaseModel):
    id: int
    official_name: str
    nickname: str
    professor_name: str | None = None

    class Config:
        from_attributes = True
