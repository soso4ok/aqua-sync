from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_current_user_optional
from app.services.storage.r2 import generate_upload_url, get_photo_url

router = APIRouter(prefix="/storage", tags=["storage"])


@router.get("/presigned-upload")
async def get_presigned_upload_url(
    content_type: str = "image/jpeg",
    user=Depends(get_current_user_optional),
):
    try:
        return generate_upload_url(content_type=content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/photo-url")
async def get_photo_view_url(
    key: str,
    user=Depends(get_current_user_optional),
):
    """Return a presigned URL for viewing a photo by its R2 key."""
    if not key:
        raise HTTPException(status_code=400, detail="key is required")
    try:
        return {"url": get_photo_url(key)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
