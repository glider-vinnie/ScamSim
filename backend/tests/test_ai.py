import json
import uuid
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.ai import (
    ai_limiter,
    cache,
    generate_gemini_variation,
    validate_safety,
)
from app.config import settings
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_ai_state():
    cache.clear()
    ai_limiter.reset()
    orig_enabled = settings.GEMINI_ENABLED
    orig_key = settings.GEMINI_API_KEY
    yield
    settings.GEMINI_ENABLED = orig_enabled
    settings.GEMINI_API_KEY = orig_key


def test_safety_filter_unit_rules():
    assert validate_safety("Valid safe message without brands or links.") is True
    assert validate_safety("") is False
    assert validate_safety("   ") is False
    assert validate_safety("A" * 401) is False
    assert validate_safety("Visit http://example.com for info") is False
    assert validate_safety("Visit https://example.com for info") is False
    assert validate_safety("HTML <b>bold</b> text") is False
    assert validate_safety("PIN code 123456 here") is False  # 5+ digits
    assert validate_safety("We are from SBI bank") is False  # Brand blocklist
    assert validate_safety("Send money via GPay") is False  # Brand blocklist


def test_disabled_flag_returns_fallback():
    settings.GEMINI_ENABLED = False
    settings.GEMINI_API_KEY = "test-key"

    source, msg, _ = generate_gemini_variation(
        "payment-screenshot",
        "A1",
        "Original Message",
        "Original Explanation",
    )
    assert source == "fallback"
    assert msg == "Original Message"


def test_missing_api_key_returns_fallback():
    settings.GEMINI_ENABLED = True
    settings.GEMINI_API_KEY = None

    source, msg, _ = generate_gemini_variation(
        "payment-screenshot",
        "A1",
        "Original Message",
        "Original Explanation",
    )
    assert source == "fallback"
    assert msg == "Original Message"


def test_valid_gemini_response_mocked():
    settings.GEMINI_ENABLED = True
    settings.GEMINI_API_KEY = "test-key"

    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = json.dumps({
        "messageVariant": "Bhai, sent funds just now! Bus departs in 5 mins.",
        "explanationVariant": "Always check your personal account statement directly.",
    })
    mock_client.generate_content.return_value = mock_resp

    source, msg, exp = generate_gemini_variation(
        "payment-screenshot",
        "A1",
        "Original Message",
        "Original Explanation",
        client=mock_client,
    )

    assert source == "gemini"
    assert "sent funds" in msg
    assert "personal account" in exp


def test_malformed_json_returns_fallback():
    settings.GEMINI_ENABLED = True
    settings.GEMINI_API_KEY = "test-key"

    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "NOT JSON AT ALL"
    mock_client.generate_content.return_value = mock_resp

    source, msg, _ = generate_gemini_variation(
        "payment-screenshot",
        "A1",
        "Original Message",
        "Original Explanation",
        client=mock_client,
    )
    assert source == "fallback"
    assert msg == "Original Message"


def test_schema_violation_returns_fallback():
    settings.GEMINI_ENABLED = True
    settings.GEMINI_API_KEY = "test-key"

    mock_client = MagicMock()
    mock_resp = MagicMock()
    # Missing explanationVariant
    mock_resp.text = json.dumps({"messageVariant": "Incomplete"})
    mock_client.generate_content.return_value = mock_resp

    source, msg, _ = generate_gemini_variation(
        "payment-screenshot",
        "A1",
        "Original Message",
        "Original Explanation",
        client=mock_client,
    )
    assert source == "fallback"
    assert msg == "Original Message"


def test_safety_violations_in_ai_output_returns_fallback():
    settings.GEMINI_ENABLED = True
    settings.GEMINI_API_KEY = "test-key"

    mock_client = MagicMock()
    mock_resp = MagicMock()

    # Brand in output
    mock_resp.text = json.dumps({
        "messageVariant": "I paid via PhonePe app directly.",
        "explanationVariant": "Valid explanation.",
    })
    mock_client.generate_content.return_value = mock_resp

    source, msg, _ = generate_gemini_variation(
        "payment-screenshot",
        "A1",
        "Original Message",
        "Original Explanation",
        client=mock_client,
    )
    assert source == "fallback"
    assert msg == "Original Message"


def test_client_exception_or_timeout_returns_fallback():
    settings.GEMINI_ENABLED = True
    settings.GEMINI_API_KEY = "test-key"

    mock_client = MagicMock()
    mock_client.generate_content.side_effect = TimeoutError("Request timed out after 8s")

    source, msg, _ = generate_gemini_variation(
        "payment-screenshot",
        "A1",
        "Original Message",
        "Original Explanation",
        client=mock_client,
    )
    assert source == "fallback"
    assert msg == "Original Message"


def test_cache_hit_avoids_repeated_gemini_call():
    settings.GEMINI_ENABLED = True
    settings.GEMINI_API_KEY = "test-key"

    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = json.dumps({
        "messageVariant": "First generation result",
        "explanationVariant": "Explanation result",
    })
    mock_client.generate_content.return_value = mock_resp

    # First call generates
    s1, m1, _ = generate_gemini_variation(
        "payment-screenshot",
        "A1",
        "Orig",
        "Orig",
        client=mock_client,
    )
    assert s1 == "gemini"
    assert mock_client.generate_content.call_count == 1

    # Second call hits cache
    s2, m2, _ = generate_gemini_variation(
        "payment-screenshot",
        "A1",
        "Orig",
        "Orig",
        client=mock_client,
    )
    assert s2 == "gemini"
    assert m2 == m1
    assert mock_client.generate_content.call_count == 1  # Not called again


def test_ai_route_stricter_rate_limiting():
    client_id = str(uuid.uuid4())
    headers = {"X-Client-Id": client_id}

    # Up to 10 requests allowed
    for _ in range(10):
        res = client.post(
            "/api/ai/variation",
            headers=headers,
            json={"scenarioId": "payment-screenshot", "nodeId": "A1"},
        )
        assert res.status_code == 200

    # 11th request triggers 429
    res_limit = client.post(
        "/api/ai/variation",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "nodeId": "A1"},
    )
    assert res_limit.status_code == 429
    assert res_limit.json()["error"]["code"] == "RATE_LIMITED"
