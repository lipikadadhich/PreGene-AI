from ai.recommendation.crispr_recommendation_engine import engine


def recommend_crispr(disease_name):
    """
    Unchanged public signature — analysis_service.py, and any other
    existing caller, keeps working exactly as before. Internally this now
    delegates to the provider-based CrisprRecommendationEngine instead of
    querying the curated KnowledgeBase directly, so the response can come
    from the curated dataset (STRONG_PRECLINICAL), the theoretical
    candidate fallback (THEORETICAL_CANDIDATE), or, in the future,
    PubMed/ClinVar/ClinicalTrials.gov/etc. — all without this function's
    contract changing.
    """
    return engine.recommend(disease_name)