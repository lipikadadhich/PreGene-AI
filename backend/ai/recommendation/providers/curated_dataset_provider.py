from ai.recommendation.knowledge_loader import KnowledgeBase
from ai.recommendation.evidence_tiers import EvidenceTier, build_recommendation_response
from ai.recommendation.providers.base_provider import CrisprEvidenceProvider


class CuratedDatasetProvider(CrisprEvidenceProvider):
    """
    Wraps the existing hand-curated CRISPR knowledge base (the same
    dataset recommend_crispr() has always used). This provider's output
    for a matched disease is unchanged from today's behavior — same
    fields, same values — just built through the shared response format
    and explicitly tagged STRONG_PRECLINICAL instead of an implicit
    'found' state.
    """

    def __init__(self):
        self._kb = KnowledgeBase()

    def lookup(self, disease_name: str) -> dict | None:
        disease = self._kb.get_disease(disease_name)

        if disease is None:
            return None

        return build_recommendation_response(
            available=True,
            tier=EvidenceTier.STRONG_PRECLINICAL,
            disease=disease["Disease"],
            gene=disease["Gene"],
            mutation=disease["Mutation_Type"],
            editing_method=disease["CRISPR_Method"],
            clinical_status=disease["Clinical_Status"],
            success_rate=disease["Success_Rate"],
            inheritance_type=disease["Inheritance_Type"],
            reference=disease["Reference"],
            ai_reasoning=disease["AI_Reasoning"],
            disease_category=disease["Inheritance_Type"],
            explanation=(
                f"{disease['Disease']} has a curated, evidence-backed CRISPR "
                f"strategy in the project's reference dataset, targeting "
                f"{disease['Gene']} via {disease['CRISPR_Method']}."
            ),
            sources=[disease["Reference"]] if disease.get("Reference") else [],
        )