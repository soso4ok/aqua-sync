from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.schemas.report import ReportCreate, ReportRead

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/", response_model=ReportRead, status_code=201)
async def submit_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    gnss_accuracy_m: float | None = Form(None),
    description: str | None = Form(None),
    photo: UploadFile = File(...),
    session: AsyncSession = Depends(get_db),
):
    """
    Citizen PWA intake endpoint.
    Runs Gemini verification + anti-fraud checks + ST_Intersects fusion.
    """
    raise NotImplementedError


@router.get("/{report_id}", response_model=ReportRead)
async def get_report(report_id: int, session: AsyncSession = Depends(get_db)):
    raise NotImplementedError


@router.get("/", response_model=list[ReportRead])
async def list_reports(
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_db),
):
    raise NotImplementedError
