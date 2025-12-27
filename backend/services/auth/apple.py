"""
Apple Sign In Verification
Verifies Apple identity tokens
"""

import os
import httpx
import jwt
from typing import Optional, Dict, Any
from jwt import PyJWKClient

# Apple's public keys endpoint
APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys"
APPLE_ISSUER = "https://appleid.apple.com"
APPLE_AUDIENCE = os.getenv("APPLE_BUNDLE_ID", "com.sidekickstudios.parkit")


async def verify_apple_token(
    identity_token: str,
    nonce: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Verify an Apple identity token.
    
    Returns decoded token data if valid, None otherwise.
    Token data includes:
    - sub: Apple user ID
    - email: User email (if provided)
    - email_verified: Whether email is verified
    """
    try:
        # Get Apple's public keys
        jwk_client = PyJWKClient(APPLE_KEYS_URL)
        signing_key = jwk_client.get_signing_key_from_jwt(identity_token)
        
        # Decode and verify the token
        decoded = jwt.decode(
            identity_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=APPLE_AUDIENCE,
            issuer=APPLE_ISSUER,
        )
        
        # Verify nonce if provided
        if nonce and decoded.get("nonce") != nonce:
            print("Apple token nonce mismatch")
            return None
        
        return {
            "sub": decoded.get("sub"),
            "email": decoded.get("email"),
            "email_verified": decoded.get("email_verified", False),
            "name": None,  # Name is only provided on first sign-in via Apple SDK
        }
        
    except jwt.ExpiredSignatureError:
        print("Apple token expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid Apple token: {e}")
        return None
    except Exception as e:
        print(f"Error verifying Apple token: {e}")
        return None


async def get_apple_public_keys() -> Optional[Dict[str, Any]]:
    """
    Fetch Apple's current public keys.
    Used for debugging/testing.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(APPLE_KEYS_URL)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        print(f"Error fetching Apple public keys: {e}")
        return None
