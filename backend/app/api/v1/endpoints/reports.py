from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_user_optional
from app.models.report import CitizenReport, PollutionType, TrustLevel
from app.models.user import User
from app.schemas.report import ReportCreate, ReportRead
from app.services.anti_fraud.gnss import GNSSValidator
from app.services.storage.r2 import upload_report_photo

router = APIRouter(prefix="/reports", tags=["reports"])
_gnss = GNSSValidator()

# Maps PWA tag ids to PollutionType enum
_TAG_TO_TYPE: dict[str, PollutionType] = {
    "algae":    PollutionType.ALGAL_BLOOM,
    "chemical": PollutionType.OIL_SLICK,
    "trash":    PollutionType.DEBRIS,
    "fish":     PollutionType.UNKNOWN,
    "pipe":     PollutionType.OIL_SLICK,
    "smell":    PollutionType.UNKNOWN,
}


def _tags_to_pollution_type(tags: list[str]) -> PollutionType:
    for tag in tags:
        if tag in _TAG_TO_TYPE:
            return _TAG_TO_TYPE[tag]
    return PollutionType.UNKNOWN


def _penalty_to_trust(penalty: float) -> TrustLevel:
    if penalty >= 1.0:
        return TrustLevel.EVIDENCE_VOID
    if penalty >= 0.4:
        return TrustLevel.LOW
    return TrustLevel.HIGH


def _calc_points(trust_level: TrustLevel, is_high_accuracy: bool) -> int:
    if trust_level == TrustLevel.EVIDENCE_VOID:
        return 0
    base = 25 if trust_level == TrustLevel.LOW else 50
    return base + (20 if is_high_accuracy else 0)


@router.post("/", response_model=ReportRead, status_code=201)
async def submit_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    gnss_accuracy_m: float = Form(...),
    description: str | None = Form(None),
    tags: str = Form(default=""),  # comma-separated tag ids from PWA
    captured_at: str | None = Form(None),
    photo: UploadFile | None = File(None),
    session: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    tag_list = [t.strip() for t in tags.split(",") if t.strip()]
    captured_dt = None
    if captured_at:
        try:
            captured_dt = datetime.fromisoformat(captured_at)
        except ValueError:
            pass

    # GNSS soft validation
    accuracy_result = _gnss.validate_accuracy(gnss_accuracy_m)
    penalty = accuracy_result.trust_penalty

    if captured_dt:
        ts_result = _gnss.validate_timestamp(captured_dt, datetime.now(timezone.utc))
        penalty = _gnss.combined_trust_penalty(accuracy_result, ts_result)

    trust_level = _penalty_to_trust(penalty)
    is_high_accuracy = gnss_accuracy_m < 5.0

    photo_key: str | None = None
    if photo:
        try:
            photo_bytes = await photo.read()
            photo_key = upload_report_photo(photo_bytes, photo.content_type or "image/jpeg")
        except Exception:
            pass  # R2 not configured or unreachable — proceed without photo

    from geoalchemy2.shape import from_shape
    from shapely.geometry import Point
    point = from_shape(Point(longitude, latitude), srid=4326)

    report = CitizenReport(
        user_id=current_user.id if current_user else None,
        location=point,
        gnss_accuracy_m=gnss_accuracy_m,
        description=description,
        photo_url=photo_key,
        pollution_type=_tags_to_pollution_type(tag_list),
        trust_level=trust_level,
        ai_verdict=f"GNSS: {accuracy_result.reason}",
        captured_at=captured_dt,
    )
    session.add(report)
    await session.commit()
    await session.refresh(report)

    points_awarded = 0
    if current_user:
        points_awarded = _calc_points(trust_level, is_high_accuracy)
        if points_awarded > 0:
            current_user.points += points_awarded
            await session.commit()

    return ReportRead(
        id=report.id,
        latitude=latitude,
        longitude=longitude,
        gnss_accuracy_m=gnss_accuracy_m,
        is_high_accuracy=is_high_accuracy,
        description=report.description,
        pollution_type=report.pollution_type,
        trust_level=report.trust_level,
        ai_verdict=report.ai_verdict,
        submitted_at=report.submitted_at,
        points_awarded=points_awarded,
    )


@router.get("/", response_model=list[ReportRead])
async def list_reports(
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_db),
):
    rows = await session.scalars(
        select(CitizenReport).order_by(CitizenReport.submitted_at.desc()).offset(skip).limit(limit)
    )
    return [
        ReportRead(
            id=r.id,
            gnss_accuracy_m=r.gnss_accuracy_m,
            description=r.description,
            pollution_type=r.pollution_type,
            trust_level=r.trust_level,
            ai_verdict=r.ai_verdict,
            submitted_at=r.submitted_at,
        )
        for r in rows
    ]


@router.get("/{report_id}", response_model=ReportRead)
async def get_report(report_id: int, session: AsyncSession = Depends(get_db)):
    report = await session.get(CitizenReport, report_id)
    if not report:
        raise HTTPException(404, detail="Report not found")
    return ReportRead(
        id=report.id,
        gnss_accuracy_m=report.gnss_accuracy_m,
        description=report.description,
        pollution_type=report.pollution_type,
        trust_level=report.trust_level,
        ai_verdict=report.ai_verdict,
        submitted_at=report.submitted_at,
    )
