import json
import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.errors import (
    AppError,
    EngineError,
    app_error_handler,
    engine_error_handler,
    generic_error_handler,
    validation_error_handler,
)
from app.routes import ai, health, progress, scenarios, sessions


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "level": record.levelname,
            "message": record.getMessage(),
            "name": record.name,
            "time": self.formatTime(record, self.datefmt),
        }
        if hasattr(record, "request_id"):
            log_record["request_id"] = record.request_id
        if record.exc_info:
            log_record["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(log_record)


handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    handlers=[handler],
)
logger = logging.getLogger("scamsim")

app = FastAPI(title="ScamSim API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def structured_logging_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
    start_time = time.time()

    response = await call_next(request)

    duration_ms = round((time.time() - start_time) * 1000, 2)
    # Structured log without PII
    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)",
        extra={"request_id": req_id},
    )
    response.headers["X-Request-Id"] = req_id
    return response


# Register Exception Handlers
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(EngineError, engine_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, generic_error_handler)

# Mount Routes under /api prefix
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(scenarios.router, prefix="/api", tags=["Scenarios"])
app.include_router(sessions.router, prefix="/api", tags=["Sessions"])
app.include_router(progress.router, prefix="/api", tags=["Progress"])
app.include_router(ai.router, prefix="/api", tags=["AI"])
