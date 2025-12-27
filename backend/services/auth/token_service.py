"""
Token Service
JWT token creation and verification
"""

import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour
REFRESH_TOKEN_EXPIRE_DAYS = 30


def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access",
    }
    
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """
    Create a JWT refresh token.
    """
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh",
    }
    
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_tokens(user_id: str) -> Dict[str, Any]:
    """
    Create both access and refresh tokens.
    Returns dict with tokens and expiry timestamp.
    """
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    
    # Calculate expiry timestamp (in milliseconds for JS)
    expires_at = int(
        (datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp() * 1000
    )
    
    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "expiresAt": expires_at,
    }


def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify an access token and return its payload.
    Returns None if token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != "access":
            return None
        
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def verify_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify a refresh token and return its payload.
    Returns None if token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != "refresh":
            return None
        
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
