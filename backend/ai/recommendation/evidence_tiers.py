from enum import Enum
from typing import Optional


class EvidenceTier(str, Enum):
    """
    Ordered from strongest to weakest evidence. Providers are tried by the
    engine in roughly this order (see crispr_recommendation_engine.py),
    though a provider is free to return any tier it has real evidence for
    (e.g. a future ClinicalTrialsProvider could return CLINICAL_TRIAL
    directly without going through weaker tiers first).
    """
    FDA_APPROVED = "FDA_APPROVED"
    CLINICAL_TRIAL = "CLINICAL_TRIAL"
    STRONG_PRECLINICAL = "STRONG_PRECLINICAL"
    EXPERIMENTAL = "EXPERIMENTAL"
    THEORETICAL_CANDIDATE = "THEORETICAL_CANDIDATE"
    NO_KNOWN_STRATEGY = "NO_KNOWN_STRATEGY"


# Human-readable label for each tier, used in the `evidence` field so the
# existing frontend (which already renders `recommendation.evidence` as a
# pill) shows something meaningful without needing a frontend change yet.
TIER_LABELS = {
    EvidenceTier.FDA_APPROVED: "FDA Approved Therapy",
    EvidenceTier.CLINICAL_TRIAL: "Active Clinical Trial",
    EvidenceTier.STRONG_PRECLINICAL: "Strong Preclinical Evidence",
    EvidenceTier.EXPERIMENTAL: "Experimental Evidence",
    EvidenceTier.THEORETICAL_CANDIDATE: "Theoretical Candidate",
    EvidenceTier.NO_KNOWN_STRATEGY: "No Known CRISPR Strategy",
}


# ---------------------------------------------------------------------------
# Validated vs. non-validated tier classification.
#
# Mirrors `hasValidatedDetails` in the frontend's src/lib/evidenceTier.ts
# EXACTLY. This is the one place on the backend that decides which tiers
# are backed by curated/real-world evidence (safe to show Mutation /
# Editing Method / Success Rate) vs. which are theoretical/absent (where
# those fields would be blank or misleading). Any consumer that renders a
# recommendation — PDF, future exports, etc. — should call
# is_validated_tier() rather than re-deriving this split itself, so the
# backend can never drift from the frontend's definition of "validated".
# ---------------------------------------------------------------------------
VALIDATED_TIERS = {
    EvidenceTier.FDA_APPROVED,
    EvidenceTier.CLINICAL_TRIAL,
    EvidenceTier.STRONG_PRECLINICAL,
    EvidenceTier.EXPERIMENTAL,
}


def is_validated_tier(tier) -> bool:
    """
    True if `tier` is one of the curated/real-world-evidence tiers.
    Accepts either an EvidenceTier member or its raw string value (since
    data loaded back from JSON/history will be a plain string), and
    degrades safely to False for None or an unrecognized value rather
    than raising.
    """
    if tier is None:
        return False
    if not isinstance(tier, EvidenceTier):
        try:
            tier = EvidenceTier(tier)
        except ValueError:
            return False
    return tier in VALIDATED_TIERS


# Fallback scientific wording for non-validated tiers, used only when a
# provider didn't already supply its own `explanation`/`message` text.
# Never invents clinical data — these are neutral, accurate statements
# about the absence of validated evidence, not fabricated findings.
NON_VALIDATED_FALLBACK_TEXT = {
    EvidenceTier.THEORETICAL_CANDIDATE: (
        "Not experimentally validated. This gene association makes it a "
        "theoretical candidate for future CRISPR-based intervention, "
        "pending direct preclinical or clinical evidence."
    ),
    EvidenceTier.NO_KNOWN_STRATEGY: (
        "No validated CRISPR strategy currently available for this disease."
    ),
}


def non_validated_fallback_text(tier) -> str:
    """
    Returns the standard fallback explanation for a non-validated tier.
    Falls back to the NO_KNOWN_STRATEGY message for any tier not in the
    mapping (defensive default, mirrors is_validated_tier's safe fallback).
    """
    if not isinstance(tier, EvidenceTier):
        try:
            tier = EvidenceTier(tier)
        except ValueError:
            return NON_VALIDATED_FALLBACK_TEXT[EvidenceTier.NO_KNOWN_STRATEGY]
    return NON_VALIDATED_FALLBACK_TEXT.get(
        tier, NON_VALIDATED_FALLBACK_TEXT[EvidenceTier.NO_KNOWN_STRATEGY]
    )


def build_recommendation_response(
    *,
    available: bool,
    tier: EvidenceTier,
    disease: str,
    gene: Optional[str] = None,
    mutation: Optional[str] = None,
    editing_method: Optional[str] = None,
    clinical_status: Optional[str] = None,
    success_rate: Optional[float] = None,
    inheritance_type: Optional[str] = None,
    reference: Optional[str] = None,
    ai_reasoning: Optional[str] = None,
    explanation: Optional[str] = None,
    sources: Optional[list] = None,
    disease_category: Optional[str] = None,
    message: Optional[str] = None,
) -> dict:
    """
    The ONE place that builds a CRISPR recommendation response dict. Every
    provider (curated, theoretical, and any future PubMed/ClinVar/etc.
    provider) must build its return value through this function, not by
    hand-rolling a dict. This guarantees every provider — present and
    future — returns an identical, predictable shape, and that no provider
    can accidentally omit a field the frontend or PDF report depends on.

    Existing keys (available, gene, mutation, editing_method,
    clinical_status, evidence, success_rate, reference, confidence,
    disease_category, ai_reasoning, message) are unchanged from the
    original recommend_crispr() contract. New keys (evidence_tier,
    sources, explanation) are strictly additive.
    """
    return {
        "available": available,
        "message": message,
        "disease": disease,
        "gene": gene,
        "mutation": mutation,
        "editing_method": editing_method,
        "clinical_status": clinical_status,
        "evidence": TIER_LABELS[tier],
        "success_rate": success_rate,
        "inheritance_type": inheritance_type,
        "ai_reasoning": ai_reasoning,
        "reference": reference,
        # Frontend fields (existing contract — confidence historically
        # mirrored success_rate; kept as-is for anything reading it today)
        "confidence": success_rate,
        "disease_category": disease_category or inheritance_type,
        # New, additive fields for the growing evidence system
        "evidence_tier": tier.value,
        "sources": sources or [],
        "explanation": explanation,
    }