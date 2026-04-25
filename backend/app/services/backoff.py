from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession


class ExponentialBackoffService:
    """Manages per-key exponential backoff stored in PostgreSQL rate_limits table."""

    BASE_SECONDS = 1.0
    MAX_SECONDS = 3600.0
    MULTIPLIER = 2.0

    async def is_allowed(self, session: AsyncSession, key: str) -> bool:
        raise NotImplementedError

    async def record_attempt(self, session: AsyncSession, key: str, success: bool) -> None:
        raise NotImplementedError

    async def reset(self, session: AsyncSession, key: str) -> None:
        raise NotImplementedError

    def _next_backoff(self, current: float) -> float:
        return min(current * self.MULTIPLIER, self.MAX_SECONDS)
