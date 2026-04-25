# AquaSync

**To create the world’s most accurate, localized water quality map by fusing macro-level Copernicus satellite data with micro-level, Galileo-verified citizen ground-truthing.**

## Architecture
- **Frontend (Admin Dashboard):** React.js + Leaflet.js
- **Frontend (Citizen Reporter):** React.js PWA
- **Backend:** Node.js + Express
- **Database:** PostgreSQL with PostGIS
- **Space Data Pipeline:** Sentinel Hub Processing API

## Components

1. **Space Base Layer:** Automated ingestion of Sentinel-2/3 imagery to generate a daily "Suspicion Map" highlighting potential algal blooms or turbidity spikes.
2. **Galileo Ground-Truth App:** A mobile interface allowing citizens to take photos of water bodies, automatically tagging them with hyper-precise GNSS coordinates and timestamps.
3. **Data Fusion Engine:** A backend logic system that flags instances where citizen reports intersect with satellite anomalies, upgrading them to "High-Priority Alerts."

## Tech Stack (Backend)

| Layer | Tech |
|---|---|
| API | Python 3.12 · FastAPI · uvicorn |
| Database | PostgreSQL 15 + PostGIS · GeoAlchemy2 · asyncpg |
| Satellite pipeline | Sentinel Hub Processing API · UWQV evalscript · rasterio |
| AI verification | Google Gemini 2.5 Flash |
| Scheduling | APScheduler (daily 06:00) |
| Task queue | PostgreSQL `FOR UPDATE SKIP LOCKED` |

## Getting Started

### Prerequisites
- Docker + Docker Compose
- Sentinel Hub account — [dataspace.copernicus.eu](https://dataspace.copernicus.eu)
- Google Gemini API key

### 1. Configure environment
```bash
cp backend/.env.example backend/.env
# Fill in: SENTINEL_HUB_CLIENT_ID, SENTINEL_HUB_CLIENT_SECRET, GEMINI_API_KEY
```

### 2. Start services
```bash
docker-compose up --build
```

### 3. Run database migrations
```bash
docker-compose exec backend alembic upgrade head
```

### 4. Verify
- API health: `http://localhost:8000/health`
- Swagger UI: `http://localhost:8000/docs`

---

_Frontend setup:_

1. Navigate to `frontend-admin/` and install dependencies.
2. Navigate to `frontend-citizen/` and install dependencies.
