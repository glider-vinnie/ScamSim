import threading
import time

from app.config import settings
from app.errors import AppError


class RateLimiter:
    def __init__(self, limit_per_minute: int = 60):
        self.limit = limit_per_minute
        self._clients: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def check(self, client_id: str) -> None:
        if not client_id:
            return

        now = time.time()
        window_start = now - 60.0

        with self._lock:
            # Filter timestamps in the last 60 seconds
            history = self._clients.get(client_id, [])
            recent = [t for t in history if t > window_start]

            if len(recent) >= self.limit:
                raise AppError(
                    status_code=429,
                    code="RATE_LIMITED",
                    message="Rate limit exceeded. Please wait a moment before trying again.",
                )

            recent.append(now)
            self._clients[client_id] = recent

    def reset(self) -> None:
        with self._lock:
            self._clients.clear()


limiter = RateLimiter(limit_per_minute=settings.RATE_LIMIT_PER_MIN)


def check_rate_limit(client_id: str) -> None:
    limiter.check(client_id)
