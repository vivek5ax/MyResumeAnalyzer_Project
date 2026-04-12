from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# ===== Request Models =====
class UserSignupRequest(BaseModel):
    """User signup request"""
    full_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128, description="Password must be 8-128 characters")


class UserLoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str = Field(..., max_length=128, description="Password must be 128 characters or less")


# ===== Response Models =====
class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    """User response (no password)"""
    id: Optional[str] = Field(None, alias="_id")
    full_name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        populate_by_name = True


class AuthResponse(BaseModel):
    """Auth response with user and token"""
    token: str
    token_type: str = "bearer"
    user: UserResponse


# ===== Database Models =====
class User:
    """User model for database operations"""
    
    @staticmethod
    def to_dict(
        full_name: str,
        email: str,
        password_hash: str,
        role: str = "user"
    ) -> dict:
        """Convert user data to dictionary for database storage"""
        return {
            "full_name": full_name,
            "email": email,
            "password_hash": password_hash,
            "role": role,  # "user" or "admin"
            "created_at": datetime.utcnow(),
            "is_active": True,
        }


class AnalysisHistory:
    """Analysis history model for database"""
    
    @staticmethod
    def to_dict(
        user_id: str,
        user_email: str,
        domain: str,
        resume_file_name: str,
        jd_source_type: str,
        result_json: dict,
        summary: dict = None
    ) -> dict:
        """Convert analysis data to dictionary for database storage"""
        return {
            "user_id": user_id,
            "user_email": user_email,
            "domain": domain,
            "resume_file_name": resume_file_name,
            "jd_source_type": jd_source_type,
            "result_json": result_json,
            "summary": summary or {},
            "created_at": datetime.utcnow(),
        }
