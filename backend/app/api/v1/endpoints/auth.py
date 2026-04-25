from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(session: AsyncSession = Depends(get_db)):
    raise NotImplementedError


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_db),
):
    raise NotImplementedError
