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
    NOT_POLLUTION = "NOT_POLLUTION"
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
        return """Act as an expert environmental forensic analyst for AquaSync.
Your task is to verify if a photo submitted by a citizen shows real water pollution.

OUTPUT FORMAT:
Return ONLY a valid JSON object. Do not include markdown blocks or any text outside the JSON.

{
  "is_water_visible": true | false,
  "contains_people": true | false,
  "is_water_pollution": true | false,
  "pollution_type": "OIL_SLICK" | "ALGAL_BLOOM" | "FOAM" | "DISCOLORATION" | "DEBRIS" | "UNKNOWN",
  "confidence": 0.0-1.0,
  "is_fraud": true | false,
  "fraud_reason": "string or null",
  "reasoning": "A concise explanation of your visual analysis"
}

STRICT VALIDATION STEPS:
1. WATER CHECK: Is there a body of water (river, lake, sea, canal) visible? If not, set is_water_pollution to false.
2. HUMAN FILTER: Is the main subject a person, a selfie, or a crowd? We DO NOT accept photos of people. If people are the focus, set is_water_pollution to false.
3. RELEVANCE: Is this a photo of a random object (car, building, animal, food)? If it's unrelated to water bodies, set is_water_pollution to false.
4. POLLUTION ANALYSIS: Only set is_water_pollution to true if you see:
   - Rainbow sheen or "oil film" on the surface (OIL_SLICK)
   - Heavy green/blue-green algal crust or "pea soup" texture (ALGAL_BLOOM)
   - Unnatural white or brown chemical foam/bubbles (FOAM)
   - Water that is unnaturally black, red, milky, or bright green (DISCOLORATION)
   - Floating trash, plastics, or industrial waste (DEBRIS)
5. FRAUD DETECTION: Set is_fraud to true if:
   - You see moiré patterns, RGB pixels, or glare suggesting a photo of a screen.
   - The image has stock photo watermarks or UI elements.
   - The image looks AI-generated or physically impossible.

CONFIDENCE SCORING:
0.9+ Clear evidence. 0.6-0.8 Visible but poor lighting/distance. <0.5 Ambiguous or low quality."""

    def _parse_response(self, raw: str) -> GeminiVerificationResult:
        """Extract JSON from Gemini response (handles markdown code blocks)."""
        # 1. Шукаємо JSON у відповіді
        json_match = re.search(r"\{.*?\}", raw, re.DOTALL)
        if not json_match:
            return GeminiVerificationResult(
                status=VerificationStatus.LOW_CONFIDENCE,
                pollution_type=PollutionType.UNKNOWN,
                confidence=0.0,
                reasoning="AI response could not be parsed as JSON",
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

        # 2. Дістаємо дані
        is_fraud = data.get("is_fraud", False)
        is_pollution = data.get("is_water_pollution", False)
        is_water = data.get("is_water_visible", True)
        has_people = data.get("contains_people", False)
        confidence = float(data.get("confidence", 0.0))
        reasoning = data.get("reasoning", "")

        # 3. Визначаємо статус
        if is_fraud:
            status = VerificationStatus.FRAUD_SUSPECTED
            reasoning = f"FRAUD: {data.get('fraud_reason') or 'Detected screen capture/forgery'}."
        elif has_people:
            status = VerificationStatus.NOT_POLLUTION
            reasoning = "Rejected: Photo contains people/selfies instead of environmental data."
        elif not is_water:
            status = VerificationStatus.NOT_POLLUTION
            reasoning = "Rejected: No water body detected in the image."
        elif not is_pollution:
            status = VerificationStatus.NOT_POLLUTION
        elif confidence >= 0.7:
            status = VerificationStatus.VERIFIED
        else:
            status = VerificationStatus.LOW_CONFIDENCE

        # 4. Мапимо pollution_type з рядка в Enum
        raw_type = data.get("pollution_type", "UNKNOWN")
        try:
            pollution_type = PollutionType(raw_type)
        except ValueError:
            pollution_type = PollutionType.UNKNOWN

        return GeminiVerificationResult(
            status=status,
            pollution_type=pollution_type,
            confidence=confidence,
            reasoning=reasoning,
        )