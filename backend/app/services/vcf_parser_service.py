"""
vcf_parser_service.py

Lightweight VCF (Variant Call Format) parser used to pre-fill the AI Risk
Assessment form after a DNA file upload, instead of requiring every field
to be typed in by hand.

IMPORTANT SCIENTIFIC/PRODUCT NOTE:
A single uploaded VCF file represents ONE individual's genotype (the
person whose DNA was sequenced) — not simultaneously a "father" and a
"mother". This service therefore extracts:
  - the detected gene + variant genotype for that one individual
  - a best-effort matched disease + inheritance pattern (by looking the
    detected gene up against the existing disease/gene dataset used
    elsewhere in the app — see app.services.dataset_service)

It deliberately does NOT guess which parent the sample belongs to. The
caller (upload_service / the frontend) is responsible for asking the
user "Is this the father's or mother's sample?" before mapping
`genotype_notation` into PatientFormData's father_genotype or
mother_genotype field. This keeps the auto-fill honest rather than
fabricating a second parent's data that was never actually sequenced.

Supports standard VCF 4.x format (tab-separated, ## meta-lines, #CHROM
header line, one or more sample columns). No external VCF library is
required — this is a deliberately minimal, dependency-free parser
sufficient for single- or multi-sample VCFs with a standard GT field.
"""

from __future__ import annotations

import re
from pathlib import Path

from app.services.dataset_service import dataset_service


# Zygosity -> the "Aa" style genotype notation the rest of the app
# (PatientFormData.father_genotype / mother_genotype, and the
# inheritance engine that consumes it) already expects.
_ZYGOSITY_TO_NOTATION = {
    "homozygous_ref": "AA",   # 0/0 - no copies of the alt allele
    "heterozygous": "Aa",     # 0/1 or 1/0 - one copy (carrier)
    "homozygous_alt": "aa",   # 1/1 - two copies (affected/homozygous)
}

# Recognized ways a variant caller/annotator commonly embeds a gene
# symbol in the INFO column. Checked in order; first match wins.
_INFO_GENE_PATTERNS = [
    re.compile(r"GENEINFO=([A-Za-z0-9\-]+)"),   # e.g. GENEINFO=BRCA1:672
    re.compile(r"GENE=([A-Za-z0-9\-]+)"),       # e.g. GENE=BRCA1
    re.compile(r"GENE_NAME=([A-Za-z0-9\-]+)"),  # e.g. GENE_NAME=BRCA1
]

# SnpEff/VEP-style ANN= field: pipe-delimited, gene symbol is the 4th
# subfield of the first annotation, e.g.
# ANN=A|missense_variant|MODERATE|BRCA1|BRCA1|transcript|...
_ANN_PATTERN = re.compile(r"ANN=([^;\t]+)")


def _extract_gene_from_info(info_field: str) -> str | None:
    for pattern in _INFO_GENE_PATTERNS:
        match = pattern.search(info_field)
        if match:
            return match.group(1)

    ann_match = _ANN_PATTERN.search(info_field)
    if ann_match:
        first_annotation = ann_match.group(1).split(",")[0]
        parts = first_annotation.split("|")
        if len(parts) > 3 and parts[3]:
            return parts[3]

    return None


def _classify_genotype(gt_value: str) -> str | None:
    """
    Normalizes a VCF GT value (e.g. '0/1', '1|0', '1/1', '0/0', './.')
    into one of: 'homozygous_ref', 'heterozygous', 'homozygous_alt'.
    Returns None for missing/uncallable genotypes ('./.', '.|.').
    """
    alleles = re.split(r"[/|]", gt_value.strip())
    if len(alleles) != 2 or "." in alleles:
        return None

    a, b = alleles
    if a == "0" and b == "0":
        return "homozygous_ref"
    if a == b:
        return "homozygous_alt"
    return "heterozygous"


def _parse_vcf_records(file_path: Path) -> list[dict]:
    """
    Reads a VCF file and returns a list of records:
    [{"gene": str | None, "zygosity": str | None}, ...]
    Skips meta-lines (##...) and the #CHROM header line. Skips any
    record where the FORMAT/sample columns are missing (no genotype to
    read) rather than raising - malformed individual lines shouldn't
    take down the whole upload.
    """
    records: list[dict] = []

    with open(file_path, "r", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("##"):
                continue
            if line.startswith("#CHROM"):
                continue

            columns = line.split("\t")
            # Standard VCF: CHROM POS ID REF ALT QUAL FILTER INFO [FORMAT] [SAMPLE...]
            if len(columns) < 8:
                continue

            info_field = columns[7]
            gene = _extract_gene_from_info(info_field)

            zygosity = None
            if len(columns) >= 10:
                format_field = columns[8]
                sample_field = columns[9]
                format_keys = format_field.split(":")
                sample_values = sample_field.split(":")

                if "GT" in format_keys:
                    gt_index = format_keys.index("GT")
                    if gt_index < len(sample_values):
                        zygosity = _classify_genotype(sample_values[gt_index])

            records.append({"gene": gene, "zygosity": zygosity})

    return records


def _match_disease_by_gene(gene: str) -> dict | None:
    """
    Looks the detected gene up against the existing disease dataset
    (the same dataset backing /diseases, /disease/{name}, /search) to
    find a matching disease + inheritance pattern. Returns None if the
    dataset isn't loaded or no match is found - never raises, since
    this is a best-effort enrichment step, not a required one.
    """
    try:
        df = dataset_service.get_dataset()
    except Exception:
        return None

    if df is None or "Gene" not in df.columns:
        return None

    matches = df[df["Gene"].astype(str).str.lower() == gene.lower()]
    if matches.empty:
        return None

    row = matches.iloc[0]
    disease = row.get("Disease")
    inheritance = row.get("Inheritance_Type") if "Inheritance_Type" in df.columns else None

    return {
        "disease": None if disease is None or str(disease) == "nan" else str(disease),
        "inheritance": None if inheritance is None or str(inheritance) == "nan" else str(inheritance),
    }


def parse_vcf_for_prediction(file_path: Path) -> dict:
    """
    Main entry point. Given the path to an already-saved, already-
    validated VCF file, extracts as much genuinely-derivable
    information as possible for pre-filling the AI Risk Assessment
    form.

    Returns a dict shaped like:
    {
        "matched": bool,                  # True if at least one gene+genotype was found
        "gene": str | None,
        "zygosity": str | None,           # "homozygous_ref" | "heterozygous" | "homozygous_alt"
        "genotype_notation": str | None,  # "AA" | "Aa" | "aa"
        "disease": str | None,            # best-effort match from the existing dataset
        "inheritance": str | None,        # best-effort match from the existing dataset
        "variants_found": int,
        "note": str,                      # human-readable summary for the UI
    }

    Never raises: any parsing failure results in a "no match" result
    with variants_found=0, so a malformed/unannotated VCF degrades
    gracefully into "please fill the form manually" rather than
    breaking the upload flow.
    """
    try:
        records = _parse_vcf_records(Path(file_path))
    except OSError:
        records = []

    # Prefer the first record that has BOTH a gene and a readable
    # genotype - that's the only combination useful for pre-filling.
    usable = [r for r in records if r["gene"] and r["zygosity"]]

    if not usable:
        return {
            "matched": False,
            "gene": None,
            "zygosity": None,
            "genotype_notation": None,
            "disease": None,
            "inheritance": None,
            "variants_found": len(records),
            "note": (
                "No gene-annotated, callable genotype was found in this "
                "VCF, so patient details couldn't be auto-filled. This is "
                "expected for VCFs without gene annotation (e.g. from "
                "SnpEff/VEP) - please enter the details manually below."
            ),
        }

    best = usable[0]
    gene = best["gene"]
    zygosity = best["zygosity"]
    genotype_notation = _ZYGOSITY_TO_NOTATION.get(zygosity)

    disease_match = _match_disease_by_gene(gene) or {}
    disease = disease_match.get("disease")
    inheritance = disease_match.get("inheritance")

    if disease:
        note = (
            f"Detected a {zygosity.replace('_', ' ')} variant in {gene}, "
            f"matched to {disease} in our knowledge base. Review the "
            f"pre-filled details before running the analysis."
        )
    else:
        note = (
            f"Detected a {zygosity.replace('_', ' ')} variant in {gene}, "
            f"but couldn't match it to a disease in our knowledge base. "
            f"Please enter the disease and remaining details manually."
        )

    return {
        "matched": True,
        "gene": gene,
        "zygosity": zygosity,
        "genotype_notation": genotype_notation,
        "disease": disease,
        "inheritance": inheritance,
        "variants_found": len(records),
        "note": note,
    }