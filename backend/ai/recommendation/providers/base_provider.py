from abc import ABC, abstractmethod
from typing import Optional


class CrisprEvidenceProvider(ABC):
    """
    The one contract every CRISPR evidence source must implement — today's
    curated dataset, today's new theoretical-candidate fallback, and every
    future source (PubMed, ClinVar, Orphanet, ClinicalTrials.gov, etc.).

    crispr_recommendation_engine.py only ever calls .lookup() on a list of
    these. Adding a new data source later means writing one new class that
    implements this interface and adding it to the engine's provider list
    — nothing else in the application needs to change.
    """

    @abstractmethod
    def lookup(self, disease_name: str) -> Optional[dict]:
        """
        Returns a fully-built recommendation response dict (see
        evidence_tiers.build_recommendation_response) if this provider has
        real evidence for the given disease, or None if it has nothing to
        contribute. Returning None is not an error — it just means the
        engine should try the next provider in the chain.

        Must NEVER fabricate a response. If the provider's underlying
        data source has no real match, return None — do not guess.
        """
        raise NotImplementedError