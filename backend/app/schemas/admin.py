from datetime import datetime
from pydantic import BaseModel
from app.schemas.guides import StudyGuideListItem


class AdminUserListItem(BaseModel):
    id: int
    username: str
    email: str
    email_verified: bool
    created_at: datetime
    study_guides: list[StudyGuideListItem] = []

    class Config:
        from_attributes = True
