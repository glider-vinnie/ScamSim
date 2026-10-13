import json
import logging
import re
import threading
import time

from pydantic import BaseModel, ConfigDict, Field

from app.config import settings
from app.ratelimit import RateLimiter
from app.scenarios_loader import BRAND_BLOCKLIST

logger = logging.getLogger(__name__)

# Stricter rate limiter: 10 requests / min / client
ai_limiter = RateLimiter(limit_per_minute=10)


class VariationSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

    messageVariant: str = Field(..., max_length=400)
    explanationVariant: str = Field(..., max_length=400)


class CacheEntry:
    def __init__(self, message_variant: str, explanation_variant: str, timestamp: float):
        self.message_variant = message_variant
        self.explanation_variant = explanation_variant
        self.timestamp = timestamp


class AICache:
    def __init__(self, ttl_seconds: int = 3600):
        self.ttl = ttl_seconds
        self._cache: dict[tuple[str, str], CacheEntry] = {}
        self._lock = threading.Lock()

    def get(self, scenario_id: str, node_id: str) -> tuple[str, str] | None:
        key = (scenario_id, node_id)
        now = time.time()
        with self._lock:
            entry = self._cache.get(key)
            if entry and (now - entry.timestamp) < self.ttl:
                return entry.message_variant, entry.explanation_variant
            if entry:
                self._cache.pop(key, None)
            return None

    def set(self, scenario_id: str, node_id: str, message: str, explanation: str) -> None:
        key = (scenario_id, node_id)
        with self._lock:
            self._cache[key] = CacheEntry(message, explanation, time.time())

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()


cache = AICache(ttl_seconds=3600)


def validate_safety(text: str) -> bool:
    """
    Validates text against §12.5 & PROMPT 10 safety constraints:
    - Non-empty and max 400 chars
    - No URLs
    - No 5+ digit runs
    - No brand names
    - No HTML tags (<, >)
    """
    if not text or not text.strip():
        return False

    if len(text) > 400:
        return False

    if "http://" in text or "https://" in text:
        return False

    if "<" in text or ">" in text:
        return False

    if re.search(r"\d{5,}", text):
        return False

    for brand in BRAND_BLOCKLIST:
        pattern = r"\b" + re.escape(brand) + r"\b"
        if re.search(pattern, text, re.IGNORECASE):
            return False

    return True


def check_ai_rate_limit(client_id: str) -> None:
    ai_limiter.check(client_id)


def generate_gemini_variation(
    scenario_id: str,
    node_id: str,
    original_message: str,
    original_explanation: str,
    client: object | None = None,
) -> tuple[str, str, str]:
    """
    Generates a wording variation via Gemini with comprehensive safety checks and fallback.
    Returns: (source, messageVariant, explanationVariant)
    source is either 'gemini' or 'fallback'.
    """
    # 1. Feature flag & API key gate
    if not settings.GEMINI_ENABLED or not settings.GEMINI_API_KEY:
        return "fallback", original_message, original_explanation

    # 2. Check in-process cache
    cached = cache.get(scenario_id, node_id)
    if cached:
        return "gemini", cached[0], cached[1]

    prompt = (
        f"You are a rewriting engine for a financial scam education simulation.\n"
        f"Original message: \"{original_message}\"\n"
        f"Original explanation: \"{original_explanation}\"\n"
        f"Rewrite the wording slightly while strictly preserving:\n"
        f"- The exact scam mechanism and same red flags\n"
        f"- Same core facts and urgency\n"
        f"- Fictional names only (Indian-English style)\n"
        f"- DO NOT use any URLs, website links, or http addresses\n"
        f"- DO NOT use real company/bank brands (SBI, HDFC, ICICI, Axis, Paytm, PhonePe, GPay, Amazon, Flipkart, etc.)\n"
        f"- DO NOT use 5+ digit numbers or real OTP codes\n"
        f"- Maximum 350 characters each. Plain text only, no markdown or HTML.\n"
        f"Return JSON adhering to the schema."
    )

    try:
        if client is None:
            from google import genai
            from google.genai import types

            gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=VariationSchema,
            )
            # Timeout 8 seconds
            response = gemini_client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=config,
            )
            raw_text = response.text
        else:
            # Used for dependency injection / mocking in tests
            response = client.generate_content(
                model=settings.GEMINI_MODEL,
                prompt=prompt,
                schema=VariationSchema,
                timeout=8,
            )
            raw_text = getattr(response, "text", str(response))

        # Parse & Validate
        data = json.loads(raw_text)
        validated = VariationSchema.model_validate(data)

        # Run safety filters
        if not validate_safety(validated.messageVariant):
            logger.warning("Gemini message variation failed safety filters; falling back.")
            return "fallback", original_message, original_explanation

        if not validate_safety(validated.explanationVariant):
            logger.warning("Gemini explanation variation failed safety filters; falling back.")
            return "fallback", original_message, original_explanation

        # Cache valid variation
        cache.set(
            scenario_id,
            node_id,
            validated.messageVariant,
            validated.explanationVariant,
        )

        return "gemini", validated.messageVariant, validated.explanationVariant

    except Exception as e:  # noqa: BLE001
        logger.warning("Gemini variation failed (%s); returning fallback.", type(e).__name__)
        return "fallback", original_message, original_explanation
