import logging
import threading
from datetime import UTC, datetime, timedelta
from typing import Protocol

from app.config import settings
from app.models import Results, Session, UserProgress

logger = logging.getLogger(__name__)


class Store(Protocol):
    def get_session(self, session_id: str) -> tuple[Session, str] | None:
        ...

    def put_session(
        self,
        session: Session,
        client_id: str,
        results: Results | None = None,
    ) -> None:
        ...

    def get_results(self, session_id: str) -> Results | None:
        ...

    def put_results(self, session_id: str, results: Results) -> None:
        ...

    def get_progress(self, client_id: str) -> UserProgress | None:
        ...

    def put_progress(self, client_id: str, progress: UserProgress) -> None:
        ...

    def delete_client(self, client_id: str) -> None:
        ...


class MemoryStore:
    def __init__(self):
        self._lock = threading.Lock()
        # session_id -> (Session, client_id)
        self._sessions: dict[str, tuple[Session, str]] = {}
        # session_id -> Results
        self._results: dict[str, Results] = {}
        # client_id -> UserProgress
        self._progress: dict[str, UserProgress] = {}

    def get_session(self, session_id: str) -> tuple[Session, str] | None:
        with self._lock:
            entry = self._sessions.get(session_id)
            if not entry:
                return None
            sess, cid = entry
            return sess.model_copy(deep=True), cid

    def put_session(
        self,
        session: Session,
        client_id: str,
        results: Results | None = None,
    ) -> None:
        with self._lock:
            self._sessions[session.id] = (session.model_copy(deep=True), client_id)
            if results:
                self._results[session.id] = results.model_copy(deep=True)

    def get_results(self, session_id: str) -> Results | None:
        with self._lock:
            res = self._results.get(session_id)
            return res.model_copy(deep=True) if res else None

    def put_results(self, session_id: str, results: Results) -> None:
        with self._lock:
            self._results[session_id] = results.model_copy(deep=True)

    def get_progress(self, client_id: str) -> UserProgress | None:
        with self._lock:
            prog = self._progress.get(client_id)
            return prog.model_copy(deep=True) if prog else None

    def put_progress(self, client_id: str, progress: UserProgress) -> None:
        with self._lock:
            self._progress[client_id] = progress.model_copy(deep=True)

    def delete_client(self, client_id: str) -> None:
        with self._lock:
            # 1. Remove progress
            self._progress.pop(client_id, None)

            # 2. Find sessions owned by this client
            session_ids_to_del = [
                sid for sid, (_, cid) in self._sessions.items() if cid == client_id
            ]

            for sid in session_ids_to_del:
                self._sessions.pop(sid, None)
                self._results.pop(sid, None)


class FirestoreStore:
    def __init__(self, client=None, project: str | None = None, database: str = "(default)"):
        if client is not None:
            self._client = client
        else:
            from google.cloud import firestore

            kwargs = {}
            if project:
                kwargs["project"] = project
            if database:
                kwargs["database"] = database
            self._client = firestore.Client(**kwargs)

        self.ttl_days = settings.SESSION_TTL_DAYS

    def _get_expires_at(self) -> datetime:
        return datetime.now(UTC) + timedelta(days=self.ttl_days)

    def get_session(self, session_id: str) -> tuple[Session, str] | None:
        doc = self._client.collection("sessions").document(session_id).get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        client_id = data.get("clientId", "")
        session_data = {k: v for k, v in data.items() if k not in ("clientId", "expiresAt")}
        return Session.model_validate(session_data), client_id

    def put_session(
        self,
        session: Session,
        client_id: str,
        results: Results | None = None,
    ) -> None:
        doc_ref = self._client.collection("sessions").document(session.id)
        data = session.model_dump()
        data["clientId"] = client_id
        data["expiresAt"] = self._get_expires_at()
        doc_ref.set(data)

        if results:
            self.put_results(session.id, results)

    def get_results(self, session_id: str) -> Results | None:
        doc = self._client.collection("results").document(session_id).get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        res_data = {k: v for k, v in data.items() if k != "expiresAt"}
        return Results.model_validate(res_data)

    def put_results(self, session_id: str, results: Results) -> None:
        doc_ref = self._client.collection("results").document(session_id)
        data = results.model_dump()
        data["expiresAt"] = self._get_expires_at()
        doc_ref.set(data)

    def get_progress(self, client_id: str) -> UserProgress | None:
        doc = self._client.collection("progress").document(client_id).get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        prog_data = {k: v for k, v in data.items() if k != "expiresAt"}
        return UserProgress.model_validate(prog_data)

    def put_progress(self, client_id: str, progress: UserProgress) -> None:
        doc_ref = self._client.collection("progress").document(client_id)
        data = progress.model_dump()
        data["expiresAt"] = self._get_expires_at()
        doc_ref.set(data)

    def delete_client(self, client_id: str) -> None:
        # Delete progress
        self._client.collection("progress").document(client_id).delete()

        # Delete client sessions and results
        sessions = (
            self._client.collection("sessions")
            .where("clientId", "==", client_id)
            .stream()
        )
        for s_doc in sessions:
            s_id = s_doc.id
            self._client.collection("sessions").document(s_id).delete()
            self._client.collection("results").document(s_id).delete()


# Global store instance initialization
_current_store: Store
store_status: str

if settings.STORE_BACKEND.lower() == "firestore":
    try:
        _current_store = FirestoreStore(
            project=settings.GOOGLE_CLOUD_PROJECT,
            database=settings.FIRESTORE_DATABASE,
        )
        store_status = "firestore"
        logger.info("Initialized Firestore storage backend")
    except Exception as e:  # noqa: BLE001
        logger.error(
            "Failed to initialize Firestore storage backend: %s. Falling back to MemoryStore.",
            e,
        )
        _current_store = MemoryStore()
        store_status = "memory-fallback"
else:
    _current_store = MemoryStore()
    store_status = "memory"


def get_store() -> Store:
    return _current_store


def get_store_status() -> str:
    return store_status


def set_store(store: Store, status: str = "memory") -> None:
    global _current_store, store_status
    _current_store = store
    store_status = status
