import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.ratelimit import limiter
from app.store import MemoryStore, set_store

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_store_and_limiter():
    set_store(MemoryStore(), status="memory")
    limiter.reset()
    yield


@pytest.fixture
def client_id():
    return str(uuid.uuid4())


@pytest.fixture
def headers(client_id):
    return {"X-Client-Id": client_id}


# 1. Invalid scenario ID
def test_negative_invalid_scenario_id(headers):
    res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "non-existent-scam-scenario", "mode": "practice"},
    )
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "SCENARIO_NOT_FOUND"


# 2. Invalid choice ID
def test_negative_invalid_choice_id(headers):
    create_res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    assert create_res.status_code == 201
    session_id = create_res.json()["session"]["id"]

    res = client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A1", "choiceId": "INVALID_CHOICE_XYZ"},
    )
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "CHOICE_INVALID"


# 3. Invalid transition (submitting decision for non-current node)
def test_negative_invalid_transition(headers):
    create_res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    session_id = create_res.json()["session"]["id"]

    res = client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A3", "choiceId": "A3-b"},
    )
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "INVALID_TRANSITION"


# 4. Repeated submission with different choice
def test_negative_repeated_submission_conflicting_choice(headers):
    create_res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    session_id = create_res.json()["session"]["id"]

    # Submit first valid choice
    client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A1", "choiceId": "A1-b"},
    )

    # Attempt to change answer for already answered node
    res = client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A1", "choiceId": "A1-a"},
    )
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "INVALID_TRANSITION"


# 5. Missing X-Client-Id header
def test_negative_missing_client_id_header():
    res = client.post(
        "/api/sessions",
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


# 6. Invalid X-Client-Id header format (not UUIDv4)
def test_negative_invalid_client_id_format():
    res = client.post(
        "/api/sessions",
        headers={"X-Client-Id": "not-a-valid-uuid-v4"},
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


# 7. Oversize / excessively large request body
def test_negative_oversize_body(headers):
    oversize_payload = {
        "scenarioId": "payment-screenshot",
        "mode": "practice",
        "padding": "x" * 100_000,
    }
    res = client.post(
        "/api/sessions",
        headers=headers,
        json=oversize_payload,
    )
    assert res.status_code in (413, 422)


# 8. Unknown fields rejected due to extra="forbid"
def test_negative_unknown_fields_rejected(headers):
    res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "mode": "practice", "hackerField": "maliciousValue"},
    )
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


# 9. Firestore-unavailable fallback simulation
def test_negative_firestore_fallback_simulated(headers):
    set_store(MemoryStore(), status="memory-fallback")
    # Health reflects memory-fallback
    health = client.get("/api/health").json()
    assert health["store"] == "memory-fallback"

    # Journey still functions correctly under fallback
    create_res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "refund-qr", "mode": "quick"},
    )
    assert create_res.status_code == 201
    session_id = create_res.json()["session"]["id"]
    get_res = client.get(f"/api/sessions/{session_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["session"]["id"] == session_id


# 10. Gemini disabled / unavailable fallback
def test_negative_gemini_disabled_fallback(headers):
    res = client.post(
        "/api/ai/variation",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "nodeId": "A1"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["source"] == "fallback"
    assert "messageVariant" in data
    assert "explanationVariant" in data
