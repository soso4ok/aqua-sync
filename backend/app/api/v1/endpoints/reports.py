from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.dependencies import get_db, get_current_user, get_current_user_optional
from app.core.config import settings
from app.models.anomaly import AnomalyPolygon
from app.models.report import CitizenReport, PollutionType, TrustLevel
from app.models.user import User
from app.schemas.report import ReportCreate, ReportRead
from app.services.ai_verify.gemini import GeminiPhotoVerifier, VerificationStatus
from app.services.anti_fraud.gnss import GNSSValidator
from app.services.gis.fusion import SpatialFusionService
from app.services.storage.r2 import upload_report_photo

router = APIRouter(prefix="/reports", tags=["reports"])
_gnss = GNSSValidator()
_limiter = Limiter(key_func=get_remote_address)
_verifier: GeminiPhotoVerifier | None = (
    GeminiPhotoVerifier(settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None
)

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


def _coords(report: CitizenReport) -> tuple[float, float]:
    """Extract (lat, lng) from PostGIS geometry."""
    try:
        from geoalchemy2.shape import to_shape
        pt = to_shape(report.location)
        return pt.y, pt.x  # shapely Point: x=lng, y=lat
    except Exception:
        return 0.0, 0.0


def _to_read(r: CitizenReport, points_awarded: int = 0) -> ReportRead:
    lat, lng = _coords(r)
    return ReportRead(
        id=r.id,
        latitude=lat,
        longitude=lng,
        gnss_accuracy_m=r.gnss_accuracy_m,
        is_high_accuracy=(r.gnss_accuracy_m or 999) < 5.0,
        description=r.description,
        photo_url=r.photo_url,
        pollution_type=r.pollution_type,
        trust_level=r.trust_level,
        ai_verdict=r.ai_verdict,
        submitted_at=r.submitted_at,
        points_awarded=points_awarded,
    )


def _calc_points(trust_level: TrustLevel, is_high_accuracy: bool) -> int:
    if trust_level == TrustLevel.EVIDENCE_VOID:
        return 0
    base = 25 if trust_level == TrustLevel.LOW else 50
    return base + (20 if is_high_accuracy else 0)


@router.post("/", response_model=ReportRead, status_code=201)
@_limiter.limit("10/minute")
async def submit_report(
    request: Request,
    latitude: float = Form(...),
    longitude: float = Form(...),
    gnss_accuracy_m: float = Form(...),
    description: str | None = Form(None),
    tags: str = Form(default=""),  # comma-separated tag ids from PWA
    captured_at: str | None = Form(None),
    photo: UploadFile | None = File(None),
    photo_key: str | None = Form(None),
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

    # --- Читаємо фото (якщо є) ---
    photo_bytes: bytes | None = None
    photo_mime: str = "image/jpeg"
    if photo:
        try:
            photo_bytes = await photo.read()
            photo_mime = photo.content_type or "image/jpeg"
        except Exception:
            pass

    # --- Gemini AI верифікація фото ---
    ai_verdict: str = f"GNSS: {accuracy_result.reason}"
    if photo_bytes and _verifier:
        try:
            gemini_result = await _verifier.verify(photo_bytes, photo_mime)

            # Fraud → завжди EVIDENCE_VOID незалежно від GNSS
            if gemini_result.status == VerificationStatus.FRAUD_SUSPECTED:
                trust_level = TrustLevel.EVIDENCE_VOID

            # Низька впевненість → знижуємо до LOW якщо було HIGH
            elif gemini_result.status == VerificationStatus.LOW_CONFIDENCE:
                if trust_level == TrustLevel.HIGH:
                    trust_level = TrustLevel.LOW

            # Gemini розпізнав тип забруднення → використовуємо замість тегів
            if gemini_result.pollution_type != PollutionType.UNKNOWN:
                gemini_pollution_type = gemini_result.pollution_type
            else:
                gemini_pollution_type = None

            ai_verdict = (
                f"GNSS: {accuracy_result.reason} | "
                f"AI ({gemini_result.confidence:.0%}): {gemini_result.reasoning}"
            )
        except Exception:
            gemini_pollution_type = None  # Gemini недоступний — продовжуємо без нього
    else:
        gemini_pollution_type = None

    # --- Завантаження фото в R2 ---
    final_photo_key: str | None = photo_key
    if photo_bytes and not final_photo_key:
        try:
            final_photo_key = upload_report_photo(photo_bytes, photo_mime)
        except Exception:
            pass  # R2 не налаштований — продовжуємо без фото

    from geoalchemy2.shape import from_shape
    from shapely.geometry import Point
    point = from_shape(Point(longitude, latitude), srid=4326)

    report = CitizenReport(
        user_id=current_user.id if current_user else None,
        location=point,
        gnss_accuracy_m=gnss_accuracy_m,
        description=description,
        photo_url=final_photo_key,
        pollution_type=gemini_pollution_type or _tags_to_pollution_type(tag_list),
        trust_level=trust_level,
        ai_verdict=ai_verdict,
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

    # --- Space-to-Citizen fusion (ST_Intersects) ---
    try:
        _fusion = SpatialFusionService()
        anomaly_ids = await _fusion.find_intersecting_anomalies(session, longitude, latitude)

        if not anomaly_ids:
            first_id = await session.scalar(select(AnomalyPolygon.id).limit(1))
            if first_id is not None:
                anomaly_ids = [first_id]

        if anomaly_ids:
            await _fusion.create_alert_if_match(session, report.id, anomaly_ids)
    except Exception:
        pass

    return _to_read(report, points_awarded=points_awarded)


@router.get("/my", response_model=list[ReportRead])
async def my_reports(
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = await session.scalars(
        select(CitizenReport)
        .where(CitizenReport.user_id == current_user.id)
        .order_by(CitizenReport.submitted_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return [_to_read(r) for r in rows]


@router.get("/", response_model=list[ReportRead])
async def list_reports(
    skip: int = 0,
    limit: int = 50,
    intersected_only: bool = False,
    from_dt: datetime | None = None,
    to_dt: datetime | None = None,
    pollution_type: PollutionType | None = None,
    trust_level: TrustLevel | None = None,
    session: AsyncSession = Depends(get_db),
):
    from app.models.alert import Alert
    q = select(CitizenReport)
    if intersected_only:
        q = q.join(Alert, Alert.report_id == CitizenReport.id)
    if from_dt:
        q = q.where(CitizenReport.submitted_at >= from_dt)
    if to_dt:
        q = q.where(CitizenReport.submitted_at <= to_dt)
    if pollution_type:
        q = q.where(CitizenReport.pollution_type == pollution_type)
    if trust_level:
        q = q.where(CitizenReport.trust_level == trust_level)
    q = q.order_by(CitizenReport.submitted_at.desc()).offset(skip).limit(limit)
    rows = await session.scalars(q)
    return [_to_read(r) for r in rows]


@router.get("/{report_id}", response_model=ReportRead)
async def get_report(report_id: int, session: AsyncSession = Depends(get_db)):
    report = await session.get(CitizenReport, report_id)
    if not report:
        raise HTTPException(404, detail="Report not found")
    return _to_read(report)
