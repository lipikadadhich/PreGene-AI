from pydantic import BaseModel
from typing import Optional


class UploadResponse(BaseModel):
    """
    Response returned after a DNA file upload is received and validated.
    Mirrors the lightweight, no-DB style used elsewhere in the backend
    (see history_service.py) — this is just a typed shape, not a DB row.
    """
    file_name: str
    file_size_bytes: int
    file_type: str  # e.g. "fasta", "fastq", "vcf", "csv", "txt", "zip"

    validation_status: str  # "valid" | "invalid" | "warning"
    validation_message: Optional[str] = None

    sequence_length: Optional[int] = None
    quality_score: Optional[float] = None

    processing_status: str = "uploaded"  # "uploaded" | "processing" | "completed" | "failed"


class UploadErrorResponse(BaseModel):
    """
    Returned instead of UploadResponse when the file fails validation
    (wrong extension, empty file, corrupt content, etc.) so the frontend
    can show a professional error state rather than a generic 500.
    """
    file_name: str
    error: str
    detail: Optional[str] = None