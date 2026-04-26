"""
Seed anomaly polygons from Sentinel Hub for a polluted lake.

Usage (from backend/):
    python -m app.scripts.seed_anomalies
"""
import asyncio
import io
from datetime import datetime

import numpy as np
import rasterio
from geoalchemy2.shape import from_shape
from rasterio.transform import from_bounds
from shapely.geometry import shape as shapely_shape

from app.db.session import AsyncSessionLocal
from app.models.anomaly import AnomalyPolygon
from app.services.gis.polygonize import AnomalyPolygonizer
from app.services.gis.raster import RasterProcessor
from app.services.sentinel.auth import SentinelHubAuth
from app.services.sentinel.processing import SentinelProcessing


def load_tiff_rasterio(data: bytes) -> np.ndarray:
    """Load float32 TIFF correctly via rasterio (PIL misreads float32 band values)."""
    with rasterio.open(io.BytesIO(data)) as src:
        return src.read(1)  # shape (H, W)

# ── Target lake ───────────────────────────────────────────────────────────────
# Coordinates supplied by user (lng, lat):
#   (-3.687824, 35.743128), (-3.686445, 35.893074), (-3.840845, 35.767206)
LAKE_BBOX = [-3.840845, 35.743128, -3.686445, 35.893074]  # [W, S, E, N]
DATE_FROM = datetime(2024, 6, 1)
DATE_TO   = datetime(2024, 8, 31)
SCENE_ID  = "lake_morocco_summer_2024"
IMAGE_W   = 512
IMAGE_H   = 512

# Filter out tiny noise polygons (in square degrees)
MIN_AREA_DEG2 = 1e-7


async def seed() -> None:
    auth        = SentinelHubAuth()
    processing  = SentinelProcessing(auth)
    raster      = RasterProcessor()
    polygonizer = AnomalyPolygonizer()

    print(f"Bbox: {LAKE_BBOX}")
    print(f"Period: {DATE_FROM.date()} → {DATE_TO.date()}")

    # ── 1. Fetch UWQV from Sentinel Hub ──────────────────────────────────────
    print("Fetching UWQV data from Sentinel Hub...")
    tar_files = await processing.fetch_uwqv(
        bbox=LAKE_BBOX,
        date_from=DATE_FROM,
        date_to=DATE_TO,
        width=IMAGE_W,
        height=IMAGE_H,
    )
    print(f"  TAR members: {list(tar_files.keys())}")

    # ── 2. Load TIFFs with rasterio (PIL misreads float32 → garbage values) ──
    chl_key = next((k for k in tar_files if "chlorophyll" in k.lower()), None)
    sed_key = next((k for k in tar_files if "sediment"    in k.lower()), None)
    chl = load_tiff_rasterio(tar_files[chl_key]) if chl_key else None
    sed = load_tiff_rasterio(tar_files[sed_key]) if sed_key else None
    arrays = {"chlorophyllIndex": chl, "sedimentIndex": sed}

    if chl is None:
        print("No chlorophyllIndex band in response — aborting.")
        return

    print(f"  CHL shape: {chl.shape}, dtype: {chl.dtype}")
    print(f"  CHL range: [{float(np.nanmin(chl)):.4f}, {float(np.nanmax(chl)):.4f}]")

    # ── 3. Compute water quality stats ───────────────────────────────────────
    stats = raster.analyze_water_quality(arrays)
    chl_stats = stats.get("chlorophyll", {})
    sed_stats = stats.get("sediment",    {})
    print(f"  Water pixels: {stats['total_water_pixels']}")
    print(f"  CHL anomaly: {chl_stats.get('anomaly_percent', 0):.1f}%  max={chl_stats.get('max', 0):.4f}")
    print(f"  SED anomaly: {sed_stats.get('anomaly_percent', 0):.1f}%  max={sed_stats.get('max', 0):.4f}")

    # ── 4. Build anomaly mask ─────────────────────────────────────────────────
    # Only finite, valid pixels (excludes NaN/inf float32 artifacts)
    finite_mask = np.isfinite(chl)
    chl_clean   = np.where(finite_mask, chl, 0.0)

    # Primary: pixels with chlorophyll anomaly (algae bloom)
    chl_mask = finite_mask & (chl_clean > raster.CHL_ANOMALY_THRESHOLD)

    if not chl_mask.any():
        print("  No CHL anomaly pixels — trying any finite water mask (CHL > 0)...")
        chl_mask = finite_mask & (chl_clean > 0)

    if not chl_mask.any():
        print("  No water detected at all — nothing to save.")
        return

    anomaly_pixel_count = int(chl_mask.sum())
    print(f"  Anomaly mask pixels: {anomaly_pixel_count}")

    # ── 5. Build geo-transform from bbox ─────────────────────────────────────
    west, south, east, north = LAKE_BBOX
    transform = from_bounds(west, south, east, north, IMAGE_W, IMAGE_H)
    profile = {"transform": transform}

    # ── 6. Polygonize ────────────────────────────────────────────────────────
    features = polygonizer.polygonize(chl_mask, profile)
    print(f"  Raw polygons from rasterio: {len(features)}")

    # Filter tiny noise
    features = [
        f for f in features
        if shapely_shape(f["geometry"]).area >= MIN_AREA_DEG2
    ]
    print(f"  After area filter: {len(features)} polygons")

    if not features:
        print("  All polygons filtered as noise — nothing to save.")
        return

    # ── 7. Save to DB ────────────────────────────────────────────────────────
    scene_date = datetime(2024, 7, 15)  # mid-summer representative date

    async with AsyncSessionLocal() as session:
        saved = 0
        for feature in features:
            geom_shapely = shapely_shape(feature["geometry"])
            if not geom_shapely.is_valid:
                geom_shapely = geom_shapely.buffer(0)

            polygon = AnomalyPolygon(
                geom=from_shape(geom_shapely, srid=4326),
                ndwi_max=None,
                chlorophyll_a=chl_stats.get("max"),
                cyanobacteria=chl_stats.get("mean"),
                turbidity=sed_stats.get("mean"),
                sentinel_scene_id=SCENE_ID,
                scene_date=scene_date,
            )
            session.add(polygon)
            saved += 1

        await session.commit()
        print(f"\nSaved {saved} anomaly polygon(s) to DB.")


if __name__ == "__main__":
    asyncio.run(seed())
