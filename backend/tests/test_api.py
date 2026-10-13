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


# --- Endpoint Happy Paths & Contracts ---


def test_endpoint_1_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["store"] == "memory"
    assert data["ai"] in ("enabled", "disabled")


def test_endpoint_2_scenarios():
    res = client.get("/api/scenarios")
    assert res.status_code == 200
    data = res.json()
    assert "scenarios" in data
    assert len(data["scenarios"]) == 3

    # Category filter
    res_filtered = client.get("/api/scenarios?category=fake_confirmation")
    assert res_filtered.status_code == 200
    assert len(res_filtered.json()["scenarios"]) == 1
    assert res_filtered.json()["scenarios"][0]["id"] == "payment-screenshot"


def test_endpoint_3_create_session(headers):
    res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    assert res.status_code == 201
    data = res.json()
    assert "session" in data
    assert "node" in data
    assert data["session"]["scenarioId"] == "payment-screenshot"
    assert data["node"]["id"] == "A1"
    assert not data["node"]["terminal"]
    # Check no answers leaked
    for ch in data["node"]["choices"]:
        assert "riskLevel" not in ch
        assert "catches" not in ch


def test_endpoint_4_decisions_happy_path(headers):
    # Start session
    create_res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    session_id = create_res.json()["session"]["id"]

    # Submit decision for A1
    dec_res = client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A1", "choiceId": "A1-b"},
    )
    assert dec_res.status_code == 200
    data = dec_res.json()
    assert data["status"] == "in_progress"
    assert data["decision"]["choiceId"] == "A1-b"
    assert data["decision"]["riskLevel"] == "safe"
    assert data["nextNode"]["id"] == "A3"


def test_endpoint_5_and_7_complete_and_results(headers):
    # Complete full run: A1-b -> A3-b -> terminal
    create_res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    session_id = create_res.json()["session"]["id"]

    # Trying GET results before completion yields 409
    res_early = client.get(f"/api/sessions/{session_id}/results", headers=headers)
    assert res_early.status_code == 409
    assert res_early.json()["error"]["code"] == "INVALID_TRANSITION"

    # Step 1
    client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A1", "choiceId": "A1-b"},
    )

    # Step 2 -> terminal
    dec2 = client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A3", "choiceId": "A3-b"},
    )
    assert dec2.status_code == 200
    assert dec2.json()["status"] == "completed"
    assert "results" in dec2.json()

    # Calling POST /complete idempotently returns results
    complete_res = client.post(f"/api/sessions/{session_id}/complete", headers=headers)
    assert complete_res.status_code == 200
    assert complete_res.json()["score"] == 100
    assert complete_res.json()["recommendedNext"] is not None

    # GET /results now succeeds
    results_res = client.get(f"/api/sessions/{session_id}/results", headers=headers)
    assert results_res.status_code == 200
    assert results_res.json()["sessionId"] == session_id


def test_endpoint_6_get_session_resume(headers):
    create_res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    session_id = create_res.json()["session"]["id"]

    client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A1", "choiceId": "A1-b"},
    )

    # Resume
    get_res = client.get(f"/api/sessions/{session_id}", headers=headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["session"]["currentNodeId"] == "A3"
    assert data["node"]["id"] == "A3"


def test_endpoint_8_and_9_progress_and_delete(headers, client_id):
    # Initial empty progress
    prog_res = client.get("/api/progress", headers=headers)
    assert prog_res.status_code == 200
    assert prog_res.json()["sessionCount"] == 0

    # Complete a session to populate progress
    create_res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    session_id = create_res.json()["session"]["id"]
    client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A1", "choiceId": "A1-a"},
    )  # Loss terminal

    # Check updated progress
    prog_updated = client.get("/api/progress", headers=headers)
    assert prog_updated.json()["sessionCount"] == 1
    assert len(prog_updated.json()["recentResults"]) == 1

    # DELETE /progress
    del_res = client.delete("/api/progress", headers=headers)
    assert del_res.status_code == 204

    # Getting progress again returns empty state
    prog_after_del = client.get("/api/progress", headers=headers)
    assert prog_after_del.json()["sessionCount"] == 0
    assert len(prog_after_del.json()["recentResults"]) == 0


def test_endpoint_10_ai_variation_fallback(headers):
    res = client.post(
        "/api/ai/variation",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "nodeId": "A1"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["source"] == "fallback"
    assert "messageVariant" in data


# --- Security, Invariants, and Error Handling Tests ---


def test_header_validation_missing_and_invalid():
    # Missing header
    res_missing = client.get("/api/progress")
    assert res_missing.status_code == 422
    assert res_missing.json()["error"]["code"] == "VALIDATION_ERROR"

    # Non-UUID header
    res_bad = client.get("/api/progress", headers={"X-Client-Id": "not-a-uuid"})
    assert res_bad.status_code == 422
    assert res_bad.json()["error"]["code"] == "VALIDATION_ERROR"


def test_ownership_wrong_owner_returns_session_not_found(headers):
    create_res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    session_id = create_res.json()["session"]["id"]

    other_client_headers = {"X-Client-Id": str(uuid.uuid4())}

    # Wrong owner trying to access
    get_res = client.get(f"/api/sessions/{session_id}", headers=other_client_headers)
    assert get_res.status_code == 404
    assert get_res.json()["error"]["code"] == "SESSION_NOT_FOUND"

    # Wrong owner trying to decide
    dec_res = client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=other_client_headers,
        json={"nodeId": "A1", "choiceId": "A1-b"},
    )
    assert dec_res.status_code == 404
    assert dec_res.json()["error"]["code"] == "SESSION_NOT_FOUND"


def test_invalid_scenario_id(headers):
    res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "ghost-scenario", "mode": "practice"},
    )
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "SCENARIO_NOT_FOUND"


def test_invalid_choice_id(headers):
    create_res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    session_id = create_res.json()["session"]["id"]

    res = client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A1", "choiceId": "INVALID_CHOICE"},
    )
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "CHOICE_INVALID"


def test_invalid_transition_wrong_node(headers):
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


def test_duplicate_submit_idempotent(headers):
    create_res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    session_id = create_res.json()["session"]["id"]

    # Submit first time
    dec1 = client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A1", "choiceId": "A1-b"},
    )
    assert dec1.status_code == 200

    # Duplicate submit of identical (A1, A1-b)
    dec2 = client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A1", "choiceId": "A1-b"},
    )
    assert dec2.status_code == 200
    assert dec1.json()["decision"]["choiceId"] == dec2.json()["decision"]["choiceId"]


def test_different_choice_conflict(headers):
    create_res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    session_id = create_res.json()["session"]["id"]

    client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A1", "choiceId": "A1-b"},
    )

    # Different choice for answered node -> 409
    dec_conflict = client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A1", "choiceId": "A1-a"},
    )
    assert dec_conflict.status_code == 409
    assert dec_conflict.json()["error"]["code"] == "INVALID_TRANSITION"


def test_completed_session_decision_error(headers):
    create_res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    session_id = create_res.json()["session"]["id"]

    # Transition to loss terminal
    client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A1", "choiceId": "A1-a"},
    )

    # Attempt decision on completed session
    res = client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A-LOSS", "choiceId": "any"},
    )
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "SESSION_COMPLETED"


def test_progress_updated_once_after_double_complete(headers):
    create_res = client.post(
        "/api/sessions",
        headers=headers,
        json={"scenarioId": "payment-screenshot", "mode": "practice"},
    )
    session_id = create_res.json()["session"]["id"]

    client.post(
        f"/api/sessions/{session_id}/decisions",
        headers=headers,
        json={"nodeId": "A1", "choiceId": "A1-a"},
    )

    # Calling /complete multiple times
    client.post(f"/api/sessions/{session_id}/complete", headers=headers)
    client.post(f"/api/sessions/{session_id}/complete", headers=headers)

    prog = client.get("/api/progress", headers=headers).json()
    assert prog["sessionCount"] == 1
    assert prog["completedScenarios"]["payment-screenshot"] == 1


def test_rate_limiting_exceeded(headers):
    # Send requests up to limit
    limiter.limit = 3
    for _ in range(3):
        res = client.get("/api/progress", headers=headers)
        assert res.status_code == 200

    # 4th request must be rate limited
    res_limit = client.get("/api/progress", headers=headers)
    assert res_limit.status_code == 429
    assert res_limit.json()["error"]["code"] == "RATE_LIMITED"


def test_firestore_unavailable_fallback():
    # Simulate fallback store
    set_store(MemoryStore(), status="memory-fallback")
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["store"] == "memory-fallback"
