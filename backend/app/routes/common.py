import uuid

from fastapi import Header

from app.errors import AppError
from app.ratelimit import check_rate_limit


def get_client_id(
    x_client_id: str | None = Header(None, alias="X-Client-Id")
) -> str:
    """
    Validates that X-Client-Id header is present, is a valid UUIDv4,
    and applies sliding-window rate limiting.
    """
    if not x_client_id:
        raise AppError(
            status_code=422,
            code="VALIDATION_ERROR",
            message="Missing required X-Client-Id header",
        )

    try:
        parsed = uuid.UUID(x_client_id, version=4)
        if str(parsed).lower() != x_client_id.lower():
            raise ValueError()
    except (ValueError, AttributeError):
        raise AppError(
            status_code=422,
            code="VALIDATION_ERROR",
            message="X-Client-Id header must be a valid UUIDv4 string",
        )

    check_rate_limit(x_client_id)
    return str(parsed)
