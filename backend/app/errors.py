from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail


class AppError(HTTPException):
    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(
            status_code=status_code,
            detail={"code": code, "message": message},
        )
        self.code = code
        self.error_message = message


# --- Engine Domain Exceptions (Pure, no HTTP) ---


class EngineError(Exception):
    """Base class for simulation engine errors."""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class InvalidTransitionError(EngineError):
    """Raised when an invalid graph transition or choice is attempted."""


class ChoiceInvalidError(EngineError):
    """Raised when a choice ID does not exist on the current decision node."""


class SessionCompletedError(EngineError):
    """Raised when attempting to advance an already completed session."""


class ScenarioNotFoundError(EngineError):
    """Raised when the specified scenario ID does not exist."""


class SessionNotFoundError(EngineError):
    """Raised when the specified session ID does not exist or wrong owner."""


class StoreUnavailableError(EngineError):
    """Raised when data storage backend is unavailable."""


class RateLimitedError(EngineError):
    """Raised when client exceeds rate limit."""


# --- Exception Handlers for FastAPI ---


def create_error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message}},
    )


async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return create_error_response(exc.status_code, exc.code, exc.error_message)


async def engine_error_handler(_request: Request, exc: EngineError) -> JSONResponse:
    if isinstance(exc, ScenarioNotFoundError):
        return create_error_response(404, "SCENARIO_NOT_FOUND", str(exc))
    elif isinstance(exc, SessionNotFoundError):
        return create_error_response(404, "SESSION_NOT_FOUND", str(exc))
    elif isinstance(exc, ChoiceInvalidError):
        return create_error_response(422, "CHOICE_INVALID", str(exc))
    elif isinstance(exc, SessionCompletedError):
        return create_error_response(409, "SESSION_COMPLETED", str(exc))
    elif isinstance(exc, InvalidTransitionError):
        return create_error_response(409, "INVALID_TRANSITION", str(exc))
    elif isinstance(exc, RateLimitedError):
        return create_error_response(429, "RATE_LIMITED", str(exc))
    elif isinstance(exc, StoreUnavailableError):
        return create_error_response(503, "STORE_UNAVAILABLE", str(exc))
    return create_error_response(500, "INTERNAL_ERROR", "An unexpected error occurred.")


async def validation_error_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    # Safe message without exposing raw internal stack
    first_error = exc.errors()[0] if exc.errors() else {}
    msg = first_error.get("msg", "Validation error")
    loc = " -> ".join(str(l) for l in first_error.get("loc", []))
    full_msg = f"{msg} ({loc})" if loc else msg
    return create_error_response(422, "VALIDATION_ERROR", full_msg)


async def generic_error_handler(_request: Request, _exc: Exception) -> JSONResponse:
    # Never leak stack traces to the client
    return create_error_response(500, "INTERNAL_ERROR", "An internal error occurred.")
