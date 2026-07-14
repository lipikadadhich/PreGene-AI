import shutil
from pathlib import Path
from datetime import datetime, timezone

from app.schemas.upload_schema import UploadResponse, UploadErrorResponse

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".fasta", ".fa", ".fastq", ".fq", ".vcf", ".csv", ".txt", ".zip"}

# Extensions where we can meaningfully count a "sequence length"
SEQUENCE_EXTENSIONS = {".fasta", ".fa", ".fastq", ".fq"}


def _get_extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def _count_sequence_length(file_path: Path, extension: str) -> int:
    """
    Very lightweight sequence length counter:
    - FASTA: sum of all non-header line lengths
    - FASTQ: sum of sequence lines (every 2nd line of every 4-line record)
    This is intentionally simple, not a full bio-format parser.
    """
    total = 0
    try:
        with open(file_path, "r", errors="ignore") as f:
            lines = f.readlines()

        if extension in (".fasta", ".fa"):
            for line in lines:
                if not line.startswith(">"):
                    total += len(line.strip())

        elif extension in (".fastq", ".fq"):
            for i in range(1, len(lines), 4):
                total += len(lines[i].strip())

    except OSError:
        return 0

    return total


def _validate_file(file_path: Path, extension: str) -> tuple[str, str | None]:
    """
    Returns (validation_status, validation_message)
    """
    if extension not in ALLOWED_EXTENSIONS:
        return "invalid", f"Unsupported file type: {extension}"

    if file_path.stat().st_size == 0:
        return "invalid", "File is empty"

    if extension in SEQUENCE_EXTENSIONS:
        seq_len = _count_sequence_length(file_path, extension)
        if seq_len == 0:
            return "warning", "No sequence data detected in file"

    return "valid", None


def save_upload(upload_file) -> UploadResponse | UploadErrorResponse:
    """
    Saves an uploaded file (FastAPI UploadFile) to disk and returns
    a structured validation/metadata response.
    """
    filename = upload_file.filename
    extension = _get_extension(filename)

    if extension not in ALLOWED_EXTENSIONS:
        return UploadErrorResponse(
            file_name=filename,
            error="Unsupported file type",
            detail=f"Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    safe_filename = f"{timestamp}_{filename}"
    dest_path = UPLOAD_DIR / safe_filename

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    validation_status, validation_message = _validate_file(dest_path, extension)

    if validation_status == "invalid":
        return UploadErrorResponse(
            file_name=filename,
            error="File validation failed",
            detail=validation_message,
        )

    sequence_length = None
    if extension in SEQUENCE_EXTENSIONS:
        sequence_length = _count_sequence_length(dest_path, extension)

    file_size = dest_path.stat().st_size

    # Placeholder quality score until a real QC step (e.g. FastQC-style
    # metrics) is wired in — flagged clearly so it isn't mistaken for
    # a real clinical metric.
    quality_score = 95.0 if validation_status == "valid" else 60.0

    return UploadResponse(
        file_name=filename,
        file_size_bytes=file_size,
        file_type=extension.lstrip("."),
        validation_status=validation_status,
        validation_message=validation_message,
        sequence_length=sequence_length,
        quality_score=quality_score,
        processing_status="uploaded",
    )