from pydantic import BaseModel
from typing import Optional


class ExtractedGeneticData(BaseModel):
    """
    Best-effort data extracted from a VCF file by vcf_parser_service.py,
    used to pre-fill the AI Risk Assessment form instead of requiring
    every field to be typed in manually.

    NOTE: a single VCF represents one individual's genotype, not a
    father AND a mother — so this deliberately does not claim to be
    "father_genotype" or "mother_genotype" directly. The frontend asks
    the user which parent (if any) this sample belongs to before
    mapping genotype_notation into PatientFormData.
    """
    matched: bool
    gene: Optional[str] = None
    zygosity: Optional[str] = None            # "homozygous_ref" | "heterozygous" | "homozygous_alt"
    genotype_notation: Optional[str] = None   # "AA" | "Aa" | "aa"
    disease: Optional[str] = None
    inheritance: Optional[str] = None
    variants_found: int = 0
    note: str


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

    # Populated only for VCF uploads where vcf_parser_service found at
    # least one usable gene+genotype. None for every other file type,
    # and None for VCFs where nothing could be confidently extracted.
    extracted_data: Optional[ExtractedGeneticData] = None


class UploadErrorResponse(BaseModel):
    """
    Returned instead of UploadResponse when the file fails validation
    (wrong extension, empty file, corrupt content, etc.) so the frontend
    can show a professional error state rather than a generic 500.
    """
    file_name: str
    error: str
    detail: Optional[str] = None