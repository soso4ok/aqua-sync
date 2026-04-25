from fastapi import APIRouter

from app.api.v1.endpoints import admin, alerts, auth, reports, satellite, storage

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router)
router.include_router(reports.router)
router.include_router(alerts.router)
router.include_router(satellite.router)
router.include_router(storage.router)
router.include_router(admin.router)
