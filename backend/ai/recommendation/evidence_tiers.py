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

# Tiers backed by curated/validated data — safe to show mutation, editing
# method, and success rate for these. This is the Python-side counterpart
# to hasValidatedDetails in src/lib/evidenceTier.ts on the frontend. Both
# lists must stay in sync (same tiers on both sides) so the PDF report and
# the UI never disagree about which tiers get full technical detail vs.
# the gene/explanation-only presentation.
_VALIDATED_TIERS = {
    EvidenceTier.FDA_APPROVED,
    EvidenceTier.CLINICAL_TRIAL,
    EvidenceTier.STRONG_PRECLINICAL,
    EvidenceTier.EXPERIMENTAL,
}


def tier_has_validated_details(tier) -> bool:
    """
    Returns True if the given tier (an EvidenceTier, its .value string, or
    None) is backed by validated data and should show mutation/editing
    method/success rate. Returns False for THEORETICAL_CANDIDATE,
    NO_KNOWN_STRATEGY, or any unrecognized/missing value — mirroring the
    frontend's safe-fallback behavior in getTierStyle().
    """
    if tier is None:
        return False
    if isinstance(tier, str):
        try:
            tier = EvidenceTier(tier)
        except ValueError:
            return False
    return tier in _VALIDATED_TIERS


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