"""
Notifications Routes
Push token registration and preferences
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from db.database import get_db
from api.dependencies import get_current_user
from models.user import User
from models.push_token import PushToken


router = APIRouter()


# Request/Response Models
class RegisterTokenRequest(BaseModel):
    token: str
    platform: str  # ios, android


class UnregisterTokenRequest(BaseModel):
    token: str


class NotificationPreferences(BaseModel):
    enabled: bool = True
    reminderTimes: List[int] = [60, 30, 15, 5]  # minutes before expiry


@router.post("/token")
async def register_push_token(
    request: RegisterTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Register a push notification token.
    """
    # Check if token already exists
    existing = db.query(PushToken).filter(
        PushToken.token == request.token
    ).first()
    
    if existing:
        # Update existing token to current user
        existing.user_id = current_user.id
        existing.platform = request.platform
        existing.updated_at = datetime.utcnow()
    else:
        # Create new token
        push_token = PushToken(
            user_id=current_user.id,
            token=request.token,
            platform=request.platform,
        )
        db.add(push_token)
    
    db.commit()
    
    return {"message": "Token registered successfully"}


@router.delete("/token")
async def unregister_push_token(
    request: UnregisterTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Unregister a push notification token.
    """
    result = db.query(PushToken).filter(
        PushToken.token == request.token,
        PushToken.user_id == current_user.id,
    ).delete()
    
    db.commit()
    
    if result == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found",
        )
    
    return {"message": "Token unregistered successfully"}


@router.get("/preferences", response_model=NotificationPreferences)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get notification preferences for the user.
    """
    # In a real app, these would be stored in the database
    # For MVP, return defaults
    return NotificationPreferences(
        enabled=True,
        reminderTimes=[60, 30, 15, 5],
    )


@router.patch("/preferences", response_model=NotificationPreferences)
async def update_preferences(
    request: NotificationPreferences,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update notification preferences.
    """
    # In a real app, save to database
    # For MVP, just return the submitted preferences
    return request
