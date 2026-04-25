from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_user
from app.core.security import SecurityService
from app.models.user import User
from app.schemas.user import TokenResponse, UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])
_security = SecurityService()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserCreate, session: AsyncSession = Depends(get_db)):
    existing = await session.scalar(select(User).where(User.email == body.email))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        hashed_password=_security.hash_password(body.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    token = _security.create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(body: UserCreate, session: AsyncSession = Depends(get_db)):
    user = await session.scalar(select(User).where(User.email == body.email))
    if not user or not _security.verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    token = _security.create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return UserRead.model_validate(current_user)
