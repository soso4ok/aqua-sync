import uuid
from functools import lru_cache

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings


@lru_cache(maxsize=1)
def _get_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def upload_report_photo(data: bytes, content_type: str = "image/jpeg") -> str:
    """Upload photo bytes to R2, return the public object key."""
    key = f"reports/{uuid.uuid4().hex}.jpg"
    _get_client().put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=key,
        Body=data,
        ContentType=content_type,
    )
    return key


def get_photo_url(key: str, expires_in: int = 3600) -> str:
    """Return a pre-signed URL valid for viewing `expires_in` seconds."""
    return _get_client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.R2_BUCKET_NAME, "Key": key},
        ExpiresIn=expires_in,
    )


def generate_upload_url(content_type: str = "image/jpeg", expires_in: int = 600) -> dict:
    """
    Return a pre-signed URL for direct upload from frontend via PUT.
    Returns: { "url": "...", "key": "..." }
    """
    key = f"reports/{uuid.uuid4().hex}.jpg"
    url = _get_client().generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.R2_BUCKET_NAME,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in,
    )
    return {"upload_url": url, "key": key}


def check_connection() -> dict:
    """Verify R2 credentials and bucket access. Returns status dict."""
    if not settings.R2_ACCOUNT_ID or not settings.R2_ACCESS_KEY_ID:
        return {"ok": False, "error": "R2 credentials not configured in .env"}
    try:
        _get_client.cache_clear()
        _get_client().head_bucket(Bucket=settings.R2_BUCKET_NAME)
        return {"ok": True, "bucket": settings.R2_BUCKET_NAME}
    except ClientError as e:
        code = e.response["Error"]["Code"]
        return {"ok": False, "error": code, "bucket": settings.R2_BUCKET_NAME}
    except Exception as e:
        return {"ok": False, "error": str(e)}
