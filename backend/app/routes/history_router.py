from fastapi import APIRouter

from app.services.history_service import get_history

router = APIRouter(
    prefix="/analysis-history",
    tags=["Analysis History"]
)


@router.get("/")
def read_history():
    return get_history()