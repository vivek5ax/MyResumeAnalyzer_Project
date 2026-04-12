from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson.objectid import ObjectId
from database import get_database
from auth_models import (
    UserSignupRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    User,
)
from auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims",
        )
    
    return user_id


@router.post("/signup", response_model=TokenResponse)
async def signup(request: UserSignupRequest):
    """User signup endpoint"""
    db = get_database()
    
    # Check if user already exists
    existing_user = await db["users"].find_one({"email": request.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Hash password
    password_hash = hash_password(request.password)
    
    # Create user document
    user_doc = User.to_dict(
        full_name=request.full_name,
        email=request.email,
        password_hash=password_hash,
        role="user"
    )
    
    # Insert into database
    result = await db["users"].insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create JWT token
    access_token = create_access_token({"sub": user_id, "email": request.email, "role": "user"})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user_id,
            "full_name": request.full_name,
            "email": request.email,
            "role": "user",
        }
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: UserLoginRequest):
    """User login endpoint"""
    db = get_database()
    
    # Find user by email
    user = await db["users"].find_one({"email": request.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Verify password
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )
    
    user_id = str(user["_id"])
    
    # Create JWT token
    access_token = create_access_token({
        "sub": user_id,
        "email": user["email"],
        "role": user.get("role", "user")
    })
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user_id,
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user.get("role", "user"),
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(user_id: str = Depends(get_current_user)):
    """Get current user profile"""
    db = get_database()
    
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return UserResponse(
        _id=str(user["_id"]),
        full_name=user["full_name"],
        email=user["email"],
        role=user.get("role", "user"),
        created_at=user["created_at"]
    )


@router.post("/logout")
async def logout(user_id: str = Depends(get_current_user)):
    """Logout endpoint (client-side token removal)"""
    return {"message": "Logged out successfully"}


@router.get("/admin/analysis-history")
async def get_admin_analysis_history(
    user_id: str = Depends(get_current_user),
    limit: int = 100,
):
    """Admin-only endpoint to fetch all users' analysis history"""
    db = get_database()

    if limit < 1:
        limit = 1
    if limit > 500:
        limit = 500

    admin_user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if str(admin_user.get("role", "user")).lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    records = await db["analysis_history"].find({}).sort("created_at", -1).limit(limit).to_list(length=limit)

    serialized_records = []
    for record in records:
        created_at = record.get("created_at")
        serialized_records.append(
            {
                "id": str(record.get("_id")),
                "user_id": str(record.get("user_id", "")),
                "user_email": record.get("user_email", "unknown_user"),
                "domain": record.get("domain", "unknown"),
                "resume_file_name": record.get("resume_file_name", ""),
                "jd_source_type": record.get("jd_source_type", ""),
                "summary": record.get("summary", {}),
                "result_json": record.get("result_json", {}),
                "created_at": created_at.isoformat() if created_at else None,
            }
        )

    return {
        "status": "success",
        "count": len(serialized_records),
        "records": serialized_records,
    }
