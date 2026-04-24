# AquaSync — Project Context for AI Agents

## What is AquaSync?
A "Space-to-Citizen" water quality monitoring platform built for the CASSINI Hackathon (48h). It fuses two data sources:
- **Macro (satellite):** Copernicus Sentinel-2/3 detects water anomalies (algal blooms, turbidity, chemical spills) from orbit
- **Micro (citizens):** Verified ground-truth reports submitted via mobile PWA with GPS-tagged photos

The core value: when a citizen report's coordinates spatially intersect a satellite-detected anomaly, the system upgrades it to a **HIGH PRIORITY ALERT** for authorities.

---

## Problem Being Solved
Satellite pixels near coastlines/rivers mix land and water ("pixel pollution"), making small-scale spills undetectable. Citizens spot pollution but have no verified reporting channel. AquaSync bridges this via spatial data fusion.

---

## Tech Stack

### Backend — Python (FastAPI)
- **FastAPI + uvicorn** — async REST API + native WebSocket for real-time dashboard updates
- **APScheduler** — cron job triggers daily Sentinel Hub ingestion each morning
- **sentinelhub SDK** — official Python SDK for Copernicus CDSE (handles OAuth2 token refresh automatically)
- **rasterio + numpy** — reads GeoTIFF from Sentinel Hub, applies NDWI threshold (>0.42 = water pixel)
- **GDAL / fiona + shapely** — converts raster anomaly masks to GeoJSON vector polygons via `gdal_polygonize`
- **SQLAlchemy 2.0 + asyncpg + GeoAlchemy2** — async ORM with PostGIS geometry types and spatial functions
- **Pydantic** — strict validation of incoming citizen report payloads
- **google-genai (Gemini 2.5 Flash)** — multimodal AI verifies submitted photos (pollution type detection + fraud detection via moiré pattern analysis)

### Background Tasks & Scheduling
- **APScheduler** — in-process scheduler triggers daily satellite ingestion (e.g., 06:00)
- **PostgreSQL Queue Mechanism** — custom message queue on top of PostgreSQL (via `Procrastinate` or raw SQL). No Redis/Celery. Uses `FOR UPDATE SKIP LOCKED` for concurrency-safe task acquisition across multiple workers.

### Database
- **PostgreSQL 15+ + PostGIS** — stores `anomaly_polygons` (from satellite) and `citizen_reports` (GPS points). Also acts as message broker for background task queue. Key query: `ST_Intersects(report.location, anomaly.geom)` triggers alert generation.

### Frontend
- **React + Leaflet.js** — Admin Dashboard renders satellite raster layer + citizen pin overlay in real-time
- **React PWA** — Citizen reporter: live camera capture only (no camera roll), `navigator.geolocation` for GNSS coordinates, offline queue via Service Worker

---

## Data Flow
```
1. APScheduler (daily) → sentinelhub SDK → Sentinel Hub Processing API
   → GeoTIFF (NDWI/turbidity evalscript)
   → rasterio/numpy threshold → gdal_polygonize → GeoJSON
   → PostGIS: anomaly_polygons

2. Citizen opens PWA → live photo + GPS coords
   → POST /reports → FastAPI
   → Gemini 2.5 Flash verifies photo (fraud check + pollution classification)
   → asyncpg inserts into citizen_reports
   → ST_Intersects check against anomaly_polygons
   → if match: HIGH PRIORITY ALERT via WebSocket → Admin Dashboard

3. Admin Dashboard (React + Leaflet)
   → Leaflet tile layer: Copernicus anomaly raster
   → GeoJSON overlay: verified citizen pins
   → Real-time WebSocket updates
```

---

## Key Water Quality Science

**NDWI (Normalized Difference Water Index):**
`(B03 - B08) / (B03 + B08)` — values > 0.42 = water pixel. Always use Sentinel-2 L2A (atmospherically corrected).

**Sentinel-2 bands used:**
- B01 (443nm) — Chlorophyll/aerosol correction
- B02 (490nm) — Cyanobacteria
- B03 (560nm) — NDWI numerator, water detection
- B04 (665nm) — Sediment
- B05-B07 (705-783nm, red-edge) — Algal bloom detection (phycocyanin peak)
- B08 (842nm, NIR) — NDWI denominator, absorbed by water

**Biochemical indicators (Se2WaQ model):**
| Indicator | Formula | Unit |
|---|---|---|
| Chlorophyll-a | `4.26 × (B03/B01)^3.94` | mg/m³ |
| Cyanobacteria | `115530.31 × (B03×B04/B02)^2.38` | 10³ cells/ml |
| Turbidity | `8.93 × (B03/B01) - 6.39` | NTU |

---

## Satellite Data APIs

**Sentinel Hub Processing API** — primary interface. Send evalscript (JS pixel function) + bounding box + time range → returns GeoTIFF or JSON stats. Auth: OAuth2 client credentials to `https://identity.dataspace.copernicus.eu`.

**New endpoint paths (2026 migration):**
- Processing: `https://sh.dataspace.copernicus.eu/process/v1`
- Statistical: `/statistics/v1`
- Catalog/STAC: `/catalog/v1`

**STAC** — use first to filter scenes by cloud coverage before requesting processing (saves compute credits).

---

## GNSS / Location Integrity
- Citizen reports use **Galileo GNSS** via browser `navigator.geolocation` — targets <5m accuracy
- **OSNMA** (Open Service Navigation Message Authentication) — cryptographic anti-spoofing protocol on Galileo signals; prevents fake coordinate injection
- **Galileo HAS** — High Accuracy Service, PPP corrections broadcast from satellites, works without cellular (relevant for remote lakes/rivers)

---

## AI Verification (Gemini 2.5 Flash)
Two-stage verification on every citizen photo:
1. **Pollution classification** — open-vocabulary prompt detects oil slicks, algal blooms, foam, discoloration, debris
2. **Fraud detection** — moiré pattern detection (FFT + Laplacian sharpness) identifies re-photographed screens. Shadow angle analysis cross-references solar azimuth with reported GPS + timestamp. Failed checks → "Evidence Void" flag: report logged but excluded from dashboards.

---

## PostGIS Key Queries
```sql
-- Core fusion logic
SELECT r.* FROM citizen_reports r, anomaly_polygons a
WHERE ST_Intersects(r.location, a.geom);

-- Proximity search
SELECT * FROM citizen_reports
WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(lon, lat), 4326), 0.005);
```

---

## Working Principles of Key Mechanisms

### 1. PostgreSQL Background Queue
No Redis or Celery. Task queue runs entirely inside PostgreSQL:
1. FastAPI inserts a record into `background_tasks` table with status `PENDING`
2. Worker process polls the table using `SELECT ... FOR UPDATE SKIP LOCKED` — prevents two workers grabbing the same task
3. On completion, worker sets status to `COMPLETED` or `FAILED` (with error log)

### 2. Satellite Pipeline (daily automated)
1. APScheduler triggers at 06:00
2. Worker sends request to Sentinel Hub Processing API — bounding box + evalscript (NDWI + turbidity indices)
3. Returns GeoTIFF → rasterio/numpy applies anomaly threshold → pixels above threshold → binary mask
4. `gdal_polygonize` converts mask to vector polygons
5. Polygons saved to PostGIS `anomalies` table as today's Suspicion Map

### 3. Space-to-Citizen Fusion (core logic)
1. Citizen submits photo + GPS point (e.g., `POINT(24.0311 49.8429)`) via PWA
2. FastAPI calls `ST_Intersects()` against anomaly polygons created in last 24–48h
3. If intersection found → satellite + human both confirm → system creates HIGH PRIORITY Alert record → WebSocket push to Admin Dashboard

### 4. Anti-Fraud & GNSS Verification
- **PWA hardware restriction** — only live camera accessible, gallery upload blocked
- **GNSS metadata collected** — accuracy/variance value captured alongside coordinates
- **Backend `verification.py` checks:**
  - Photo timestamp vs. server arrival time (within tolerance)
  - `gnss_accuracy < 5 meters`
  - Moiré pattern detection (FFT + Laplacian) for re-photographed screens
  - Shadow angle vs. expected solar azimuth for reported GPS + timestamp
- Failed checks → report flagged `Low Trust` or `Evidence Void` (logged but excluded from dashboards)

---

## Project Folder Structure

```
aquasync-backend/
├── alembic/                # DB migration config and files
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── reports.py    # Citizen report intake (PWA)
│   │   │   │   ├── alerts.py     # Alert management for Dashboard
│   │   │   │   ├── satellite.py  # Satellite data management
│   │   │   │   └── auth.py       # Registration & login (JWT)
│   │   │   └── api.py            # v1 router aggregator
│   │   └── dependencies.py       # get_db, current_user, etc.
│   ├── core/
│   │   ├── config.py             # .env reader (Sentinel API, Postgres URL)
│   │   ├── security.py           # JWT logic, password hashing
│   │   └── exceptions.py         # Custom error handlers
│   ├── db/
│   │   ├── base.py               # All model imports for Alembic
│   │   └── session.py            # SQLAlchemy Engine + SessionLocal
│   ├── models/                   # DB models (PostGIS + GeoAlchemy2)
│   │   ├── user.py               # Users/admins table
│   │   ├── report.py             # Citizen Reports (Point geometry)
│   │   ├── anomaly.py            # Satellite Anomalies (Polygon geometry)
│   │   ├── alert.py              # Alerts (fusion results)
│   │   ├── task.py               # Background task queue table
│   │   └── rate_limit.py         # Exponential backoff table
│   ├── schemas/                  # Pydantic validation schemas
│   │   ├── report.py             # Incoming PWA data schemas
│   │   ├── satellite.py          # Sentinel Hub metadata schemas
│   │   └── alert.py              # Alert output schemas for Dashboard
│   ├── services/                 # Business logic (Fat Services pattern)
│   │   ├── sentinel/             # Sentinel Hub & Processing API
│   │   ├── gis/                  # Spatial analysis (ST_Intersects, GDAL)
│   │   ├── ai_verify/            # Google Gemini integration
│   │   ├── anti_fraud/           # Moiré detection, GNSS validation
│   │   └── backoff.py            # Exponential backoff implementation
│   ├── worker/
│   │   ├── scheduler.py          # APScheduler setup (daily cron)
│   │   ├── pg_queue.py           # FOR UPDATE SKIP LOCKED logic
│   │   └── tasks.py              # Background task functions (satellite pipeline)
│   └── main.py                   # FastAPI entry point
├── tests/
├── alembic.ini
├── Dockerfile
├── docker-compose.yml            # Services: Backend + PostGIS
├── .env
├── .env.example
└── requirements.txt
```

---

## Hackathon MVP Scope (48h)
- Admin dashboard: Sentinel-2 NDWI/turbidity layer over a test region (known polluted lake)
- Citizen PWA: live photo + GPS → POST to backend
- "Aha moment": submitted report pin appears **on top of** satellite anomaly polygon in real-time on admin map
- No auth, no offline queue, no production hardening — synchronous processing acceptable for demo

---

## What AquaSync is NOT (out of scope for MVP)
- Flood monitoring (CEMS/GloFAS integration — documented but deferred)
- SAR/Sentinel-1 radar processing
- openEO datacube workflows
- Galileo HAS/OSNMA hardware-level integration (browser geolocation used as proxy)
- Multi-region or global coverage
