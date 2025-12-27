"""
Google Sign In Verification
Verifies Google access tokens and ID tokens
"""

import os
import httpx
from typing import Optional, Dict, Any

# Google's token info endpoint
GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"
GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


async def verify_google_token(access_token: str) -> Optional[Dict[str, Any]]:
    """
    Verify a Google access token and get user info.
    
    Returns user data if valid, None otherwise.
    User data includes:
    - sub: Google user ID
    - email: User email
    - name: User's full name
    - picture: Profile picture URL
    """
    try:
        async with httpx.AsyncClient() as client:
            # Get user info using the access token
            response = await client.get(
                GOOGLE_USER_INFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            
            if response.status_code != 200:
                print(f"Google token validation failed: {response.status_code}")
                return None
            
            user_info = response.json()
            
            return {
                "sub": user_info.get("sub"),
                "email": user_info.get("email"),
                "email_verified": user_info.get("email_verified", False),
                "name": user_info.get("name"),
                "picture": user_info.get("picture"),
                "given_name": user_info.get("given_name"),
                "family_name": user_info.get("family_name"),
            }
            
    except Exception as e:
        print(f"Error verifying Google token: {e}")
        return None


async def verify_google_id_token(id_token: str) -> Optional[Dict[str, Any]]:
    """
    Verify a Google ID token.
    Alternative method using ID token instead of access token.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                GOOGLE_TOKEN_INFO_URL,
                params={"id_token": id_token},
            )
            
            if response.status_code != 200:
                print(f"Google ID token validation failed: {response.status_code}")
                return None
            
            token_info = response.json()
            
            # Verify audience matches our client ID
            # In production, check against your actual Google client IDs
            
            return {
                "sub": token_info.get("sub"),
                "email": token_info.get("email"),
                "email_verified": token_info.get("email_verified") == "true",
                "name": token_info.get("name"),
                "picture": token_info.get("picture"),
            }
            
    except Exception as e:
        print(f"Error verifying Google ID token: {e}")
        return None
