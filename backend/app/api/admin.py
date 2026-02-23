from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.user import User
from app.models.guide import StudyGuide
from app.models.course import Course, Professor
from app.models.verification import EmailVerification, PasswordResetToken
from app.schemas.admin import AdminUserListItem
from app.schemas.guides import StudyGuideListItem
from app.api.deps import get_current_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserListItem])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """List all users with their study guides (admin only)."""
    users = db.query(User).order_by(User.id).all()
    result = []
    for user in users:
        guides = (
            db.query(StudyGuide)
            .filter(StudyGuide.user_id == user.id)
            .order_by(StudyGuide.created_at.desc())
            .all()
        )
        result.append(
            AdminUserListItem(
                id=user.id,
                username=user.username,
                email=user.email,
                email_verified=getattr(user, "email_verified", False),
                created_at=user.created_at,
                study_guides=[
                    StudyGuideListItem(
                        id=g.id,
                        title=g.title,
                        course=g.course or "",
                        professor_name=g.professor_name or "",
                        status=g.status,
                        created_at=g.created_at,
                    )
                    for g in guides
                ],
            )
        )
    return result


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Delete a user and all their data (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Delete in order; use instance delete so ORM cascades run (guides → sources/output, courses → attachments/tests)
    for guide in db.query(StudyGuide).filter(StudyGuide.user_id == user_id).all():
        db.delete(guide)
    for course in db.query(Course).filter(Course.user_id == user_id).all():
        db.delete(course)
    db.query(Professor).filter(Professor.user_id == user_id).delete()
    db.query(EmailVerification).filter(EmailVerification.user_id == user_id).delete()
    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
