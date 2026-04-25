import json
import pytest

from app.services.ai_verify.gemini import GeminiPhotoVerifier, VerificationStatus
from app.models.report import PollutionType

# We test only _parse_response — no API key needed
verifier = GeminiPhotoVerifier.__new__(GeminiPhotoVerifier)


def _resp(is_water_pollution: bool, is_fraud: bool, confidence: float = 0.9,
          pollution_type: str = "ALGAL_BLOOM", fraud_reason: str | None = None) -> str:
    return json.dumps({
        "is_water_pollution": is_water_pollution,
        "pollution_type": pollution_type,
        "confidence": confidence,
        "is_fraud": is_fraud,
        "fraud_reason": fraud_reason,
        "reasoning": "test",
    })


def test_verified_pollution():
    result = verifier._parse_response(_resp(is_water_pollution=True, is_fraud=False, confidence=0.9))
    assert result.status == VerificationStatus.VERIFIED
    assert result.pollution_type == PollutionType.ALGAL_BLOOM


def test_selfie_is_not_pollution():
    result = verifier._parse_response(_resp(is_water_pollution=False, is_fraud=False, confidence=0.8))
    assert result.status == VerificationStatus.NOT_POLLUTION


def test_fraud_screenshot():
    result = verifier._parse_response(_resp(is_water_pollution=False, is_fraud=True, fraud_reason="screen reshot"))
    assert result.status == VerificationStatus.FRAUD_SUSPECTED
    assert "FRAUD DETECTED" in result.reasoning


def test_low_confidence_still_pollution():
    result = verifier._parse_response(_resp(is_water_pollution=True, is_fraud=False, confidence=0.4))
    assert result.status == VerificationStatus.LOW_CONFIDENCE


def test_unparseable_response():
    result = verifier._parse_response("sorry I cannot help with that")
    assert result.status == VerificationStatus.LOW_CONFIDENCE
    assert result.confidence == 0.0
