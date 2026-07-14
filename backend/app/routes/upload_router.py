from fastapi import APIRouter, UploadFile, File

from app.services.upload_service import save_upload
from app.schemas.upload_schema import UploadResponse, UploadErrorResponse

router = APIRouter(
    prefix="/upload",
    tags=["DNA Upload"]
)


@router.post("/", response_model=None)
def upload_dna_file(file: UploadFile = File(...)) -> UploadResponse | UploadErrorResponse:
    return save_upload(file)