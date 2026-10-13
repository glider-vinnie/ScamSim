from fastapi import APIRouter, Depends, status

from app.adaptive import initial_progress
from app.routes.common import get_client_id
from app.store import get_store

router = APIRouter()


# 8. GET /api/progress
@router.get("/progress")
def get_user_progress(client_id: str = Depends(get_client_id)):
    store = get_store()
    prog = store.get_progress(client_id)
    if not prog:
        prog = initial_progress()
    return prog


# 9. DELETE /api/progress -> 204
@router.delete("/progress", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_progress(client_id: str = Depends(get_client_id)):
    store = get_store()
    store.delete_client(client_id)
