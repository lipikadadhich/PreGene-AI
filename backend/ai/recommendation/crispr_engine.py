from ai.recommendation.crispr_recommendation_engine import engine
from ai.services.llm_enrichment_service import generate_crispr_reasoning


def recommend_crispr(disease_name):
    """
    Unchanged public signature — analysis_service.py, and any other
    existing caller, keeps working exactly as before. Internally this
    still delegates to the provider-based CrisprRecommendationEngine for
    the actual recommendation (gene, mutation, editing_method, evidence
    tier, etc.) — that deterministic logic is untouched.

    NEW: after getting the deterministic recommendation, this now asks
    an LLM to generate a natural-language `ai_reasoning` explanation
    grounded strictly in the fields the engine already returned. If the
    LLM is unavailable or the call fails for any reason,
    generate_crispr_reasoning() returns None and `ai_reasoning` is
    simply left unset — the recommendation itself is never blocked or
    altered by an LLM outage.
    """
    result = engine.recommend(disease_name)

    if not result.get("ai_reasoning"):
        reasoning = generate_crispr_reasoning(result, disease_name)
        if reasoning:
            result["ai_reasoning"] = reasoning

    return result