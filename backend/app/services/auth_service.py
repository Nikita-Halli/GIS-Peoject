from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import SignupRequest, LoginRequest, TokenResponse, UserPublic
from app.auth.jwt import get_password_hash, verify_password, create_access_token

class AuthService:
    @staticmethod
    async def signup(db: AsyncSession, signup_data: SignupRequest):
        # Check if user already exists
        result = await db.execute(select(User).filter(User.email == signup_data.email))
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )
        
        # Create new user
        hashed_password = get_password_hash(signup_data.password)
        db_user = User(
            full_name=signup_data.full_name,
            email=signup_data.email,
            password_hash=hashed_password,
            role=signup_data.role,
            organization=signup_data.organization,
            phone_number=signup_data.phone_number
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        
        # Generate token
        access_token = create_access_token(
            data={"sub": str(db_user.id), "email": db_user.email, "role": db_user.role}
        )
        
        return TokenResponse(
            access_token=access_token,
            user=UserPublic.from_orm(db_user)
        )

    @staticmethod
    async def login(db: AsyncSession, login_data: LoginRequest):
        result = await db.execute(select(User).filter(User.email == login_data.email))
        user = result.scalars().first()
        
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role}
        )
        
        return TokenResponse(
            access_token=access_token,
            user=UserPublic.from_orm(user)
        )
