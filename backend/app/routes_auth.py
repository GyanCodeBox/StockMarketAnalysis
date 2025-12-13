"""
Authentication routes for Kite Connect token generation
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from app.services.kite_auth import KiteAuth

router = APIRouter()


class TokenRequest(BaseModel):
    redirect_url: str


class TokenResponse(BaseModel):
    access_token: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    email: Optional[str] = None
    broker: Optional[str] = None


@router.get("/kite/login-url")
async def get_kite_login_url():
    """
    Get the Kite Connect login URL for OAuth flow
    
    Returns:
        Login URL to redirect user to
    """
    api_key = os.getenv("KITE_API_KEY", "").strip()
    api_secret = os.getenv("KITE_API_SECRET", "").strip()
    
    if not api_key or not api_secret:
        raise HTTPException(
            status_code=400,
            detail="KITE_API_KEY and KITE_API_SECRET must be set in .env file"
        )
    
    auth = KiteAuth(api_key, api_secret)
    login_url = auth.get_login_url()
    
    if not login_url:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate login URL"
        )
    
    return {
        "login_url": login_url,
        "instructions": "Open this URL in your browser, login to Kite, and use the redirect URL with /api/kite/generate-token endpoint"
    }


@router.post("/kite/generate-token", response_model=TokenResponse)
async def generate_kite_token(request: TokenRequest):
    """
    Generate access token from OAuth redirect URL
    
    Args:
        request: Contains redirect_url from Kite login
        
    Returns:
        Access token and user information
    """
    api_key = os.getenv("KITE_API_KEY", "").strip()
    api_secret = os.getenv("KITE_API_SECRET", "").strip()
    
    if not api_key or not api_secret:
        raise HTTPException(
            status_code=400,
            detail="KITE_API_KEY and KITE_API_SECRET must be set in .env file"
        )
    
    auth = KiteAuth(api_key, api_secret)
    
    # Extract request token from redirect URL
    request_token = auth.extract_request_token(request.redirect_url)
    
    if not request_token:
        raise HTTPException(
            status_code=400,
            detail="Invalid redirect URL. Could not extract request_token"
        )
    
    # Generate access token
    data = auth.generate_access_token(request_token)
    
    if not data:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate access token. Request token may be expired or invalid."
        )
    
    return TokenResponse(
        access_token=data.get("access_token", ""),
        user_id=data.get("user_id"),
        user_name=data.get("user_name"),
        email=data.get("email"),
        broker=data.get("broker")
    )


@router.get("/kite/validate-token")
async def validate_kite_token():
    """
    Validate the current access token in .env file
    
    Returns:
        Validation result
    """
    api_key = os.getenv("KITE_API_KEY", "").strip()
    api_secret = os.getenv("KITE_API_SECRET", "").strip()
    access_token = os.getenv("KITE_ACCESS_TOKEN", "").strip()
    
    if not api_key or not access_token:
        return {
            "valid": False,
            "message": "KITE_API_KEY or KITE_ACCESS_TOKEN not set"
        }
    
    auth = KiteAuth(api_key, api_secret)
    is_valid = auth.validate_access_token(access_token)
    
    return {
        "valid": is_valid,
        "message": "Token is valid" if is_valid else "Token is invalid or expired"
    }

