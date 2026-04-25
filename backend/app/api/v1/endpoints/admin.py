from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_admin, get_db
from app.core.config import settings
from app.core.security import SecurityService
from app.models.report import CitizenReport, TrustLevel
from app.models.user import User
from app.schemas.user import TokenResponse, UserCreate, UserRead
from app.services.storage.r2 import check_connection

router = APIRouter(prefix="/admin", tags=["admin"])
_security = SecurityService()


def _token_pair(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=_security.create_access_token(str(user.id), user.token_version),
        refresh_token=_security.create_refresh_token(str(user.id), user.token_version),
        user=UserRead.model_validate(user),
    )


@router.post("/auth/register", response_model=TokenResponse, status_code=201)
async def admin_register(
    body: UserCreate,
    admin_secret: str,
    session: AsyncSession = Depends(get_db),
):
    """Register a new admin account. Requires ADMIN_SECRET_KEY query param."""
    if admin_secret != settings.ADMIN_SECRET_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin secret")

    existing = await session.scalar(select(User).where(User.email == body.email))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        hashed_password=_security.hash_password(body.password),
        is_admin=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return _token_pair(user)


@router.post("/auth/login", response_model=TokenResponse)
async def admin_login(body: UserCreate, session: AsyncSession = Depends(get_db)):
    """Login for admins only."""
    user = await session.scalar(select(User).where(User.email == body.email))
    if not user or not _security.verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    return _token_pair(user)


@router.get("/r2/check")
async def r2_health(_: User = Depends(get_current_admin)):
    return check_connection()


@router.get("/users", response_model=list[UserRead])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    rows = await session.scalars(select(User).order_by(User.id).offset(skip).limit(limit))
    return [UserRead.model_validate(u) for u in rows]


@router.patch("/reports/{report_id}/trust")
async def set_trust_level(
    report_id: int,
    trust_level: TrustLevel,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    report = await session.get(CitizenReport, report_id)
    if not report:
        raise HTTPException(404, detail="Report not found")
    report.trust_level = trust_level
    await session.commit()
    return {"id": report_id, "trust_level": trust_level}
