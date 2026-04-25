from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.dependencies import get_db, get_current_user
from app.core.security import SecurityService
from app.models.user import User
from app.schemas.user import TokenResponse, UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])
_security = SecurityService()
_limiter = Limiter(key_func=get_remote_address)


def _token_pair(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=_security.create_access_token(str(user.id), user.token_version),
        refresh_token=_security.create_refresh_token(str(user.id), user.token_version),
        user=UserRead.model_validate(user),
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
@_limiter.limit("3/minute")
async def register(request: Request, body: UserCreate, session: AsyncSession = Depends(get_db)):
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
    return _token_pair(user)


@router.post("/login", response_model=TokenResponse)
@_limiter.limit("5/minute")
async def login(request: Request, body: UserCreate, session: AsyncSession = Depends(get_db)):
    user = await session.scalar(select(User).where(User.email == body.email))
    if not user or not _security.verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    return _token_pair(user)


@router.post("/refresh", response_model=TokenResponse)
@_limiter.limit("10/minute")
async def refresh(request: Request, refresh_token: str, session: AsyncSession = Depends(get_db)):
    """Issue a new access token using a valid refresh token."""
    try:
        payload = _security.decode_token(refresh_token, token_type="refresh")
        user_id = int(payload["sub"])
    except (ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = await session.scalar(select(User).where(User.id == user_id, User.is_active == True))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return _token_pair(user)


@router.get("/me", response_model=TokenResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Returns current user data with a fresh token pair."""
    return _token_pair(current_user)


@router.post("/logout", status_code=204)
async def logout(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Invalidate all existing tokens by incrementing token_version."""
    current_user.token_version += 1
    await session.commit()
