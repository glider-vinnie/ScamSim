import uuid
from unittest.mock import MagicMock

from app.models import Session, UserProgress
from app.store import FirestoreStore, MemoryStore


def create_sample_session(session_id: str) -> Session:
    return Session(
        id=session_id,
        scenarioId="payment-screenshot",
        mode="practice",
        status="in_progress",
        startTime="2026-10-13T00:00:00Z",
        completionTime=None,
        currentNodeId="A1",
        decisions=[],
        score=None,
        identifiedRedFlags=[],
        missedRedFlags=[],
        skillUpdates={
            "urgency": 0,
            "impersonation": 0,
            "payment_verification": 0,
            "qr_collect": 0,
            "safe_verification": 0,
        },
    )


def test_memory_store_contract():
    store = MemoryStore()
    client_id = str(uuid.uuid4())
    session = create_sample_session("sess-1")

    # 1. Put and get session
    store.put_session(session, client_id)
    retrieved = store.get_session("sess-1")
    assert retrieved is not None
    sess_out, cid_out = retrieved
    assert sess_out.id == "sess-1"
    assert cid_out == client_id

    # 2. Put and get progress
    prog = UserProgress(
        sessionCount=1,
        completedScenarios={"payment-screenshot": 1},
        skillEstimates={
            "urgency": 50,
            "impersonation": 50,
            "payment_verification": 50,
            "qr_collect": 50,
            "safe_verification": 50,
        },
        recommendedNextScenario=None,
        recentResults=[],
        frequentlyMissedFlags=[],
    )
    store.put_progress(client_id, prog)
    prog_out = store.get_progress(client_id)
    assert prog_out is not None
    assert prog_out.sessionCount == 1

    # 3. Delete client
    store.delete_client(client_id)
    assert store.get_session("sess-1") is None
    assert store.get_progress(client_id) is None


def test_firestore_store_mock_client():
    mock_firestore_client = MagicMock()
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "id": "sess-fs-1",
        "scenarioId": "payment-screenshot",
        "mode": "practice",
        "status": "in_progress",
        "startTime": "2026-10-13T00:00:00Z",
        "completionTime": None,
        "currentNodeId": "A1",
        "decisions": [],
        "score": None,
        "identifiedRedFlags": [],
        "missedRedFlags": [],
        "skillUpdates": {
            "urgency": 0,
            "impersonation": 0,
            "payment_verification": 0,
            "qr_collect": 0,
            "safe_verification": 0,
        },
        "clientId": "mock-client-123",
        "expiresAt": "2026-11-13T00:00:00Z",
    }
    mock_firestore_client.collection.return_value.document.return_value.get.return_value = (
        mock_doc
    )

    store = FirestoreStore(client=mock_firestore_client)
    ret = store.get_session("sess-fs-1")
    assert ret is not None
    sess, cid = ret
    assert sess.id == "sess-fs-1"
    assert cid == "mock-client-123"
