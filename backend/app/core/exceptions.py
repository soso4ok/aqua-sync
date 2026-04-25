from fastapi import Request
from fastapi.responses import JSONResponse


class AquaSyncException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail


class ReportNotFoundException(AquaSyncException):
    def __init__(self, report_id: int):
        super().__init__(404, f"Report {report_id} not found")


class AnomalyNotFoundException(AquaSyncException):
    def __init__(self, anomaly_id: int):
        super().__init__(404, f"Anomaly {anomaly_id} not found")


class UnauthorizedException(AquaSyncException):
    def __init__(self):
        super().__init__(401, "Not authenticated")


class FraudDetectedException(AquaSyncException):
    def __init__(self, reason: str):
        super().__init__(422, f"Evidence void: {reason}")


async def aquasync_exception_handler(request: Request, exc: AquaSyncException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
