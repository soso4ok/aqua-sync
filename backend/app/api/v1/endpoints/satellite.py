import httpx
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_admin
from app.core.config import settings
from app.models.anomaly import AnomalyPolygon
from app.models.user import User
from app.schemas.satellite import AnomalyPolygonRead, SatelliteIngestRequest

router = APIRouter(prefix="/satellite", tags=["satellite"])


def _to_read(a: AnomalyPolygon) -> AnomalyPolygonRead:
    geojson = None
    lat, lng, radius = None, None, None
    try:
        from geoalchemy2.shape import to_shape
        shape = to_shape(a.geom)
        geojson = shape.__geo_interface__
        centroid = shape.centroid
        lat, lng = centroid.y, centroid.x
        # approximate bounding radius in metres
        from shapely.ops import transform
        import pyproj, functools
        proj = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True).transform
        shape_m = transform(proj, shape)
        radius = int(shape_m.area ** 0.5)
    except Exception:
        pass

    return AnomalyPolygonRead(
        id=a.id,
        lat=lat,
        lng=lng,
        radius=radius,
        ndwi_max=a.ndwi_max,
        chlorophyll_a=a.chlorophyll_a,
        cyanobacteria=a.cyanobacteria,
        turbidity=a.turbidity,
        sentinel_scene_id=a.sentinel_scene_id,
        detected_at=a.detected_at,
        scene_date=a.scene_date,
        geojson=geojson,
    )


@router.post("/token")
async def get_sh_token():
    """Proxy to Sentinel Hub Identity API."""
    if not settings.SENTINEL_HUB_CLIENT_ID or not settings.SENTINEL_HUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Sentinel Hub credentials not configured")
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            settings.SENTINEL_HUB_TOKEN_URL,
            data={
                "grant_type": "client_credentials",
                "client_id": settings.SENTINEL_HUB_CLIENT_ID,
                "client_secret": settings.SENTINEL_HUB_CLIENT_SECRET,
            }
        )
        if not resp.is_success:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()


@router.post("/process")
async def proxy_sh_process(payload: dict, response: Response):
    """Proxy to Sentinel Hub Processing API."""
    # We need a token first (internally)
    token_resp = await get_sh_token()
    token = token_resp["access_token"]

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            settings.SENTINEL_HUB_PROCESS_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "image/png"
            }
        )
        if not resp.is_success:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        
        return Response(content=resp.content, media_type="image/png")


@router.post("/ingest", status_code=202)
async def trigger_ingest(
    body: SatelliteIngestRequest,
    _admin: User = Depends(get_current_admin),
):
    return {"status": "queued", "bbox": body.bbox}


@router.get("/anomalies", response_model=list[AnomalyPolygonRead])
async def list_anomalies(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_db),
):
    rows = await session.scalars(
        select(AnomalyPolygon).order_by(AnomalyPolygon.detected_at.desc()).offset(skip).limit(limit)
    )
    return [_to_read(a) for a in rows]


@router.get("/anomalies/{anomaly_id}", response_model=AnomalyPolygonRead)
async def get_anomaly(anomaly_id: int, session: AsyncSession = Depends(get_db)):
    a = await session.get(AnomalyPolygon, anomaly_id)
    if not a:
        raise HTTPException(404, detail="Anomaly not found")
    return _to_read(a)
