"""
Users Routes
Profile and saved locations endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from db.database import get_db
from api.dependencies import get_current_user
from models.user import User, SavedLocation


router = APIRouter()


# Request/Response Models
class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    avatarUrl: Optional[str]
    provider: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None


class CoordinatesRequest(BaseModel):
    latitude: float
    longitude: float


class SavedLocationRequest(BaseModel):
    name: str
    coordinates: CoordinatesRequest
    address: Optional[str] = None


class SavedLocationResponse(BaseModel):
    id: str
    userId: str
    name: str
    latitude: float
    longitude: float
    address: Optional[str]
    createdAt: datetime

    class Config:
        from_attributes = True


@router.get("/me", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
):
    """
    Get current user profile.
    """
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        avatarUrl=current_user.avatar_url,
        provider=current_user.provider,
        createdAt=current_user.created_at,
        updatedAt=current_user.updated_at,
    )


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    request: UpdateUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update current user profile.
    """
    if request.name is not None:
        current_user.name = request.name
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        avatarUrl=current_user.avatar_url,
        provider=current_user.provider,
        createdAt=current_user.created_at,
        updatedAt=current_user.updated_at,
    )


@router.delete("/me")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete user account and all associated data.
    """
    # Delete saved locations
    db.query(SavedLocation).filter(
        SavedLocation.user_id == current_user.id
    ).delete()
    
    # Delete user
    db.delete(current_user)
    db.commit()
    
    return {"message": "Account deleted successfully"}


@router.get("/locations", response_model=List[SavedLocationResponse])
async def get_saved_locations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get user's saved locations (home, work, etc).
    """
    locations = db.query(SavedLocation).filter(
        SavedLocation.user_id == current_user.id
    ).all()
    
    return [
        SavedLocationResponse(
            id=str(loc.id),
            userId=str(loc.user_id),
            name=loc.name,
            latitude=loc.latitude,
            longitude=loc.longitude,
            address=loc.address,
            createdAt=loc.created_at,
        )
        for loc in locations
    ]


@router.post("/locations", response_model=SavedLocationResponse)
async def add_saved_location(
    request: SavedLocationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add a saved location.
    """
    # Check if name already exists for this user
    existing = db.query(SavedLocation).filter(
        SavedLocation.user_id == current_user.id,
        SavedLocation.name == request.name,
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Location '{request.name}' already exists",
        )
    
    location = SavedLocation(
        user_id=current_user.id,
        name=request.name,
        latitude=request.coordinates.latitude,
        longitude=request.coordinates.longitude,
        address=request.address,
    )
    
    db.add(location)
    db.commit()
    db.refresh(location)
    
    return SavedLocationResponse(
        id=str(location.id),
        userId=str(location.user_id),
        name=location.name,
        latitude=location.latitude,
        longitude=location.longitude,
        address=location.address,
        createdAt=location.created_at,
    )


@router.delete("/locations/{location_id}")
async def remove_saved_location(
    location_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove a saved location.
    """
    location = db.query(SavedLocation).filter(
        SavedLocation.id == location_id,
        SavedLocation.user_id == current_user.id,
    ).first()
    
    if location is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found",
        )
    
    db.delete(location)
    db.commit()
    
    return {"message": "Location removed successfully"}
