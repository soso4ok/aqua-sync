from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_admin
from app.models.user import User
from app.services.storage.r2 import check_connection

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/r2/check")
async def r2_health(_: User = Depends(get_current_admin)):
    return check_connection()
