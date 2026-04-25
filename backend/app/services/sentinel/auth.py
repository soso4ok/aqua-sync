from app.core.config import settings


class SentinelHubAuth:
    """Manages OAuth2 client-credentials token lifecycle for Sentinel Hub CDSE."""

    def __init__(self):
        self._token: str | None = None
        self._expires_at: float = 0.0

    async def get_token(self) -> str:
        raise NotImplementedError

    async def _fetch_token(self) -> tuple[str, float]:
        """Returns (access_token, expiry_timestamp)."""
        raise NotImplementedError
