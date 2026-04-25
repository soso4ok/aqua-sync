from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import BackgroundTask, TaskStatus


class PGQueue:
    """PostgreSQL-backed task queue using FOR UPDATE SKIP LOCKED for concurrency safety."""

    async def enqueue(
        self,
        session: AsyncSession,
        task_type: str,
        payload: str | None = None,
    ) -> BackgroundTask:
        raise NotImplementedError

    async def dequeue(
        self,
        session: AsyncSession,
        task_type: str | None = None,
    ) -> BackgroundTask | None:
        """Atomically grabs one PENDING task and marks it IN_PROGRESS."""
        raise NotImplementedError

    async def complete(
        self,
        session: AsyncSession,
        task_id: int,
    ) -> None:
        raise NotImplementedError

    async def fail(
        self,
        session: AsyncSession,
        task_id: int,
        error: str,
    ) -> None:
        raise NotImplementedError
