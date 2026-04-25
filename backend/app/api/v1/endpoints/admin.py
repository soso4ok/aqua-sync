from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_admin, get_db
from app.models.report import CitizenReport, TrustLevel
from app.models.user import User
from app.schemas.user import UserRead
from app.services.storage.r2 import check_connection

router = APIRouter(prefix="/admin", tags=["admin"])


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
