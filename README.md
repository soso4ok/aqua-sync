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

## Getting Started

1. Start the PostgreSQL + PostGIS database:
   ```bash
   docker-compose up -d
   ```
2. Navigate to `backend/` and install dependencies.
3. Navigate to `frontend-admin/` and install dependencies.
4. Navigate to `frontend-citizen/` and install dependencies.
