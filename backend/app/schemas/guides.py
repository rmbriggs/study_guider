from datetime import datetime
from pydantic import BaseModel


class GuideSourceResponse(BaseModel):
    id: int
    file_name: str
    file_type: str

    class Config:
        from_attributes = True


class GuideOutputResponse(BaseModel):
    id: int
    content: str
    model_used: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class StudyGuideResponse(BaseModel):
    id: int
    user_id: int
    title: str
    course: str
    professor_name: str
    user_specs: str | None
    status: str
    created_at: datetime
    output: GuideOutputResponse | None = None
    sources: list[GuideSourceResponse] = []

    class Config:
        from_attributes = True


class StudyGuideListItem(BaseModel):
    id: int
    title: str
    course: str
    professor_name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class CreateGuideResponse(BaseModel):
    id: int
    title: str
    status: str
    output: GuideOutputResponse | None = None

    class Config:
        from_attributes = True


class GuideOptionsResponse(BaseModel):
    courses: list[str]
    professors: list[str]


class CreateGuideFromBlockRequest(BaseModel):
    course_id: int
    test_id: int | None = None  # None = uncategorized block
    title: str | None = None
