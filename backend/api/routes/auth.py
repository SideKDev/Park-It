"""
Authentication Routes
Apple and Google SSO endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from db.database import get_db
from models.user import User
from services.auth.token_service import create_tokens, verify_refresh_token
from services.auth.apple import verify_apple_token
from services.auth.google import verify_google_token


router = APIRouter()


# Request/Response Models
class AppleLoginRequest(BaseModel):
    idToken: str
    nonce: Optional[str] = None


class GoogleLoginRequest(BaseModel):
    accessToken: str


class RefreshRequest(BaseModel):
    refreshToken: str


class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
    expiresAt: int  # Unix timestamp


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


class AuthResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse


@router.post("/apple", response_model=AuthResponse)
async def login_with_apple(
    request: AppleLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate with Apple Sign In.
    Verifies the Apple identity token and creates/updates the user.
    """
    # Verify Apple token
    apple_data = await verify_apple_token(request.idToken, request.nonce)
    if apple_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Apple token",
        )
    
    # Find or create user
    user = db.query(User).filter(User.apple_id == apple_data["sub"]).first()
    
    if user is None:
        # Check if email exists with different provider
        existing = db.query(User).filter(User.email == apple_data.get("email")).first()
        if existing:
            # Link Apple to existing account
            existing.apple_id = apple_data["sub"]
            user = existing
        else:
            # Create new user
            user = User(
                email=apple_data.get("email", f"{apple_data['sub']}@privaterelay.appleid.com"),
                name=apple_data.get("name"),
                apple_id=apple_data["sub"],
                provider="apple",
            )
            db.add(user)
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    # Create tokens
    tokens = create_tokens(str(user.id))
    
    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(**tokens),
    )


@router.post("/google", response_model=AuthResponse)
async def login_with_google(
    request: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate with Google Sign In.
    Verifies the Google access token and creates/updates the user.
    """
    # Verify Google token
    google_data = await verify_google_token(request.accessToken)
    if google_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )
    
    # Find or create user
    user = db.query(User).filter(User.google_id == google_data["sub"]).first()
    
    if user is None:
        # Check if email exists with different provider
        existing = db.query(User).filter(User.email == google_data.get("email")).first()
        if existing:
            # Link Google to existing account
            existing.google_id = google_data["sub"]
            user = existing
        else:
            # Create new user
            user = User(
                email=google_data.get("email"),
                name=google_data.get("name"),
                avatar_url=google_data.get("picture"),
                google_id=google_data["sub"],
                provider="google",
            )
            db.add(user)
    else:
        # Update existing user info
        if google_data.get("name"):
            user.name = google_data["name"]
        if google_data.get("picture"):
            user.avatar_url = google_data["picture"]
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    # Create tokens
    tokens = create_tokens(str(user.id))
    
    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(**tokens),
    )


@router.post("/refresh", response_model=dict)
async def refresh_tokens(
    request: RefreshRequest,
    db: Session = Depends(get_db),
):
    """
    Refresh access token using refresh token.
    """
    payload = verify_refresh_token(request.refreshToken)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    # Create new tokens
    tokens = create_tokens(str(user.id))
    
    return {"tokens": TokenResponse(**tokens)}


@router.post("/logout")
async def logout():
    """
    Logout endpoint.
    In a production app, you would invalidate the refresh token here.
    """
    return {"message": "Logged out successfully"}
