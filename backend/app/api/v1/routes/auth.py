from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.user import SignupRequest, LoginRequest, TokenResponse, UserPublic
from app.services.auth_service import AuthService
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(signup_data: SignupRequest, db: AsyncSession = Depends(get_db)):
    """
    Register a new user and return access token.
    """
    return await AuthService.signup(db, signup_data)

@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate user and return access token.
    """
    return await AuthService.login(db, login_data)

@router.get("/me", response_model=UserPublic)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current logged-in user details.
    """
    return current_user

@router.post("/logout")
async def logout():
    """
    Stateless logout (frontend should discard the token).
    """
    return {"message": "Logged out successfully"}
