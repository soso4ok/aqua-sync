from dataclasses import dataclass
from enum import Enum

from app.models.report import PollutionType


class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    FRAUD_SUSPECTED = "FRAUD_SUSPECTED"


@dataclass
class GeminiVerificationResult:
    status: VerificationStatus
    pollution_type: PollutionType
    confidence: float
    reasoning: str


class GeminiPhotoVerifier:
    """Multimodal Gemini 2.5 Flash verification: pollution classification + fraud detection."""

    MODEL = "gemini-2.5-flash"

    def __init__(self, api_key: str):
        self._api_key = api_key
        self._client = None

    async def verify(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
    ) -> GeminiVerificationResult:
        raise NotImplementedError

    def _build_classification_prompt(self) -> str:
        raise NotImplementedError

    def _parse_response(self, raw: str) -> GeminiVerificationResult:
        raise NotImplementedError
