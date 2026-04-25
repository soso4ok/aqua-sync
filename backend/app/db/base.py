from app.db.session import Base  # noqa: F401 — Alembic autogenerate needs all models imported here

from app.models.user import User  # noqa: F401
from app.models.report import CitizenReport  # noqa: F401
from app.models.anomaly import AnomalyPolygon  # noqa: F401
from app.models.alert import Alert  # noqa: F401
from app.models.task import BackgroundTask  # noqa: F401
from app.models.rate_limit import RateLimit  # noqa: F401
