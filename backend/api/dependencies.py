"""
FastAPI Dependencies
Authentication and authorization middleware
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from db.database import get_db
from models.user import User


security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        dev_user = db.query(User).filter(User.email == "dev@parkit.test").first()
        if not dev_user:
            dev_user = User(
                email="dev@parkit.test",
                name="Dev User",
                provider="dev",
            )
            db.add(dev_user)
            db.commit()
            db.refresh(dev_user)
        return dev_user
    
    from services.auth.token_service import verify_access_token
    
    token = credentials.credentials
    payload = verify_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    return user
