import shutil
from pathlib import Path
from datetime import datetime, timezone

from app.schemas.upload_schema import (
    UploadResponse,
    UploadErrorResponse,
    ExtractedGeneticData,
)
from app.services import notification_service
from app.services.vcf_parser_service import parse_vcf_for_prediction

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


def _extract_genetic_data_if_vcf(
    file_path: Path, extension: str
) -> ExtractedGeneticData | None:
    """
    For valid VCF files, runs the VCF parser to pull out gene/genotype/
    disease/inheritance info for pre-filling the AI Risk Assessment
    form. Returns None for every other file type.

    Never raises: vcf_parser_service already guarantees a graceful
    "no match" dict rather than an exception, but this is wrapped in a
    try/except anyway so a parser bug can never take down the upload
    endpoint itself - the file is already safely saved and validated
    by this point regardless of what happens here.
    """
    if extension != ".vcf":
        return None

    try:
        parsed = parse_vcf_for_prediction(file_path)
        return ExtractedGeneticData(**parsed)
    except Exception:
        return None


def save_upload(upload_file) -> UploadResponse | UploadErrorResponse:
    """
    Saves an uploaded file (FastAPI UploadFile) to disk and returns
    a structured validation/metadata response.
    """
    filename = upload_file.filename
    extension = _get_extension(filename)

    if extension not in ALLOWED_EXTENSIONS:
        notification_service.create_notification(
            type="dna_upload_failed",
            title="DNA upload failed",
            message=f"'{filename}' was rejected: unsupported file type ({extension}).",
            link="/upload",
        )
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
        notification_service.create_notification(
            type="dna_upload_failed",
            title="DNA upload failed",
            message=f"'{filename}' failed validation: {validation_message}",
            link="/upload",
        )
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

    # Only attempted for valid VCF files. FASTA/FASTQ/CSV/TXT/ZIP all
    # return None here, unchanged from before this feature existed.
    extracted_data = None
    if validation_status == "valid":
        extracted_data = _extract_genetic_data_if_vcf(dest_path, extension)

    notification_service.create_notification(
        type="dna_uploaded",
        title="DNA file uploaded",
        message=f"'{filename}' was uploaded and validated successfully.",
        link="/upload",
    )

    return UploadResponse(
        file_name=filename,
        file_size_bytes=file_size,
        file_type=extension.lstrip("."),
        validation_status=validation_status,
        validation_message=validation_message,
        sequence_length=sequence_length,
        quality_score=quality_score,
        processing_status="uploaded",
        extracted_data=extracted_data,
    )