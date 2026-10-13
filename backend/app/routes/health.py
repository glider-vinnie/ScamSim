from fastapi import APIRouter

from app.config import settings
from app.store import get_store_status

router = APIRouter()


@router.get("/health")
def get_health():
    return {
        "status": "ok",
        "store": get_store_status(),
        "ai": "enabled" if settings.GEMINI_ENABLED else "disabled",
    }
