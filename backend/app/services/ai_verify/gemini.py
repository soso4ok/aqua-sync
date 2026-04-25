import json
import re
from dataclasses import dataclass
from enum import Enum

from google import genai
from google.genai import types

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
        self._client = genai.Client(api_key=api_key)

    async def verify(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
    ) -> GeminiVerificationResult:
        """Send photo to Gemini and return structured verification result."""
        prompt = self._build_classification_prompt()
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

        response = await self._client.aio.models.generate_content(
            model=self.MODEL,
            contents=[image_part, prompt],
        )
        return self._parse_response(response.text or "")

    def _build_classification_prompt(self) -> str:
        return """You are an AI for a water quality monitoring platform (AquaSync).
Analyze this photo and respond ONLY with a valid JSON object — no markdown, no explanation outside JSON.

{
  "is_water_pollution": true | false,
  "pollution_type": "OIL_SLICK" | "ALGAL_BLOOM" | "FOAM" | "DISCOLORATION" | "DEBRIS" | "UNKNOWN",
  "confidence": 0.0-1.0,
  "is_fraud": true | false,
  "fraud_reason": "string or null",
  "reasoning": "one sentence in English"
}

Classification rules:
- is_water_pollution: true ONLY if you clearly see water contamination (oil sheen, green algal bloom, chemical discoloration, debris floating in water, unnatural foam on water surface)
- is_fraud: true if the image looks like a re-photographed screen/monitor (visible pixels, moiré pattern), a stock photo watermark, or is completely unrelated to water
- confidence: your certainty level from 0.0 to 1.0
- pollution_type: best matching category; use UNKNOWN if pollution is present but type is unclear
- reasoning: brief one-sentence explanation of your decision"""

    def _parse_response(self, raw: str) -> GeminiVerificationResult:
        """Extract JSON from Gemini response (handles markdown code blocks)."""
        json_match = re.search(r"\{.*?\}", raw, re.DOTALL)
        if not json_match:
            return GeminiVerificationResult(
                status=VerificationStatus.LOW_CONFIDENCE,
                pollution_type=PollutionType.UNKNOWN,
                confidence=0.0,
                reasoning="AI response could not be parsed",
            )

        try:
            data = json.loads(json_match.group())
        except json.JSONDecodeError:
            return GeminiVerificationResult(
                status=VerificationStatus.LOW_CONFIDENCE,
                pollution_type=PollutionType.UNKNOWN,
                confidence=0.0,
                reasoning="Invalid JSON from AI model",
            )

        is_fraud: bool = data.get("is_fraud", False)
        is_pollution: bool = data.get("is_water_pollution", False)
        confidence: float = float(data.get("confidence", 0.5))

        # Determine verification status
        if is_fraud:
            status = VerificationStatus.FRAUD_SUSPECTED
        elif is_pollution and confidence >= 0.6:
            status = VerificationStatus.VERIFIED
        else:
            status = VerificationStatus.LOW_CONFIDENCE

        # Map pollution_type string → enum
        raw_type: str = data.get("pollution_type", "UNKNOWN")
        try:
            pollution_type = PollutionType(raw_type)
        except ValueError:
            pollution_type = PollutionType.UNKNOWN

        reasoning: str = data.get("reasoning", "")
        fraud_reason: str | None = data.get("fraud_reason")
        if fraud_reason:
            reasoning = f"FRAUD DETECTED: {fraud_reason}. {reasoning}"

        return GeminiVerificationResult(
            status=status,
            pollution_type=pollution_type,
            confidence=confidence,
            reasoning=reasoning,
        )
