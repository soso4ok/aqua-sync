import time

import httpx

from app.core.config import settings


class SentinelHubAuth:
    """Manages OAuth2 client-credentials token lifecycle for Sentinel Hub CDSE."""

    def __init__(self):
        self._token: str | None = None
        self._expires_at: float = 0.0

    async def get_token(self) -> str:
        if self._token and time.time() < self._expires_at - 30:
            return self._token
        self._token, self._expires_at = await self._fetch_token()
        return self._token

    async def _fetch_token(self) -> tuple[str, float]:
        """Returns (access_token, expiry_timestamp)."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                settings.SENTINEL_HUB_TOKEN_URL,
                data={
                    "grant_type": "client_credentials",
                    "client_id": settings.SENTINEL_HUB_CLIENT_ID,
                    "client_secret": settings.SENTINEL_HUB_CLIENT_SECRET,
                },
            )
            resp.raise_for_status()
            body = resp.json()
            expires_at = time.time() + body.get("expires_in", 3600)
            return body["access_token"], expires_at
