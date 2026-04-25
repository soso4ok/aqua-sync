from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_current_user_optional
from app.services.storage.r2 import generate_upload_url

router = APIRouter(prefix="/storage", tags=["storage"])

@router.get("/presigned-upload")
async def get_presigned_upload_url(
    content_type: str = "image/jpeg",
    user=Depends(get_current_user_optional)
):
    """
    Returns a pre-signed URL for direct upload to R2 from the frontend.
    """
    try:
        return generate_upload_url(content_type=content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
