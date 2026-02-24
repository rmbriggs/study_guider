from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ProfessorResponse(BaseModel):
    id: int
    name: str
    specialties: str | None = None
    description: str | None = None
    study_guide_quiz: dict | None = None  # { "questions": [{"id":"q1","text":"..."}], "answers": {"q1":"..."} }

    class Config:
        from_attributes = True


class ProfessorQuizAnswersUpdate(BaseModel):
    answers: dict[str, str]  # question id -> answer text


class ProfessorCreate(BaseModel):
    name: str
    specialties: str | None = None
    description: str | None = None


class ProfessorUpdate(BaseModel):
    name: str | None = None
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


class CourseUpdate(BaseModel):
    official_name: str | None = None
    nickname: str | None = None
    professor_id: int | None = None
    personal_description: str | None = None


# ---- Test sections (course materials) ----
class CourseTestResponse(BaseModel):
    id: int
    course_id: int
    name: str
    sort_order: int
    is_analyzed: bool = False
    analysis_summary: str | None = None

    class Config:
        from_attributes = True


class CourseTestCreate(BaseModel):
    name: str
    sort_order: int | None = None


class CourseTestUpdate(BaseModel):
    name: str | None = None
    sort_order: int | None = None


class CourseAttachmentResponse(BaseModel):
    id: int
    course_id: int
    test_id: int | None
    test_ids: list[int] = []
    file_name: str
    file_type: str
    attachment_kind: str
    allow_multiple_blocks: bool = False

    class Config:
        from_attributes = True


class CourseMaterialsResponse(BaseModel):
    tests: list[CourseTestResponse]
    attachments: list[CourseAttachmentResponse]


class AttachmentUpdate(BaseModel):
    test_id: int | None = None
    test_ids: list[int] | None = None
    file_name: str | None = None
    allow_multiple_blocks: bool | None = None


class CourseTestAnalysisResponse(BaseModel):
    id: int
    test_id: int
    topic_frequency: dict | None = None
    conversion_patterns: dict | None = None
    question_formats: dict | None = None
    high_signal_handouts: list | None = None
    summary: str | None = None
    analyzed_at: datetime

    model_config = ConfigDict(from_attributes=True)
