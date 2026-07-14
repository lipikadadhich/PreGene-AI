from ai.recommendation.evidence_tiers import EvidenceTier, build_recommendation_response
from ai.recommendation.providers.curated_dataset_provider import CuratedDatasetProvider
from ai.recommendation.providers.theoretical_candidate_provider import TheoreticalCandidateProvider


class CrisprRecommendationEngine:
    """
    Orchestrates a chain of CrisprEvidenceProvider instances. Tries each
    provider in order and returns the first real (non-None) match — this
    is the ONE place that knows the provider priority order, so adding a
    new provider later (PubMed, ClinVar, ClinicalTrials.gov, etc.) means
    inserting it into self._providers at the right priority position and
    nothing else in the app changes.

    Priority order today reflects evidence strength: the curated dataset
    (STRONG_PRECLINICAL, hand-verified) is tried before the theoretical
    fallback (THEORETICAL_CANDIDATE, weaker/broader). Future providers
    for FDA_APPROVED / CLINICAL_TRIAL evidence should be inserted BEFORE
    CuratedDatasetProvider, since stronger real-world evidence should
    outrank a curated-but-preclinical entry when both exist.
    """

    def __init__(self, providers=None):
        self._providers = providers or [
            CuratedDatasetProvider(),
            TheoreticalCandidateProvider(),
        ]

    def recommend(self, disease_name: str) -> dict:
        for provider in self._providers:
            result = provider.lookup(disease_name)
            if result is not None:
                return result

        # No provider had any real evidence at all — the only case where
        # a generic, non-fabricated fallback message is appropriate.
        return build_recommendation_response(
            available=False,
            tier=EvidenceTier.NO_KNOWN_STRATEGY,
            disease=disease_name,
            message="CRISPR recommendation is currently unavailable for this disease.",
            explanation=(
                "No curated CRISPR strategy or known gene association was "
                "found for this disease in the current knowledge base."
            ),
        )


# Module-level singleton — mirrors the existing `kb = KnowledgeBase()`
# pattern in the original crispr_engine.py, so callers don't need to
# construct the engine themselves.
engine = CrisprRecommendationEngine()