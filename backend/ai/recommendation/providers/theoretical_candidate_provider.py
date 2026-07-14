from app.services.dataset_service import dataset_service
from ai.recommendation.evidence_tiers import EvidenceTier, build_recommendation_response
from ai.recommendation.providers.base_provider import CrisprEvidenceProvider


class TheoreticalCandidateProvider(CrisprEvidenceProvider):
    """
    Fallback provider for diseases that have no entry in the curated
    CRISPR dataset, but DO have a known gene association in the project's
    full disease library (pregene_master_dataset.csv — ~8,300 diseases).

    This never fabricates a mutation, editing method, or success rate —
    those stay None/unknown. It only asserts what the dataset actually
    contains: that a gene is associated with the disease, which makes
    CRISPR-based intervention a theoretical (not validated) future
    candidate. If the disease has no gene on record either, this provider
    returns None and the engine falls through to NO_KNOWN_STRATEGY.
    """

    def lookup(self, disease_name: str) -> dict | None:
        df = dataset_service.get_dataset()

        if df is None:
            return None

        matches = df[df["Disease"].str.lower() == disease_name.lower()]

        if matches.empty:
            return None

        row = matches.iloc[0]
        gene = row.get("Gene")
        gene_name = row.get("Gene_Name")
        inheritance_type = row.get("Inheritance_Type")

        # A disease with no gene on record isn't a theoretical candidate
        # either — nothing real to base even a theoretical claim on.
        if not gene or (isinstance(gene, float)):  # NaN comes through as float
            return None

        gene_display = f"{gene} ({gene_name})" if gene_name else gene

        explanation = (
            f"This disease is associated with the {gene_display} gene. "
            f"Although no validated CRISPR therapy currently exists in the "
            f"project's curated dataset, this known gene association makes "
            f"it a theoretical future candidate for CRISPR-based "
            f"intervention, pending direct preclinical or clinical evidence."
        )

        return build_recommendation_response(
            available=True,
            tier=EvidenceTier.THEORETICAL_CANDIDATE,
            disease=row.get("Disease", disease_name),
            gene=gene,
            mutation=None,
            editing_method=None,
            clinical_status=None,
            success_rate=None,
            inheritance_type=inheritance_type,
            reference=None,
            ai_reasoning=explanation,
            disease_category=inheritance_type,
            explanation=explanation,
            sources=[],
            message=None,
        )