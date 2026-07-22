from ai.services.llm_enrichment_service import generate_counselling_notes


def _template_counselling(risk_score: float) -> list[str]:
    """
    The original fixed, risk-bracket-based templates. Used as a fallback
    whenever LLM-generated counselling isn't available (no disease_name
    given, or the LLM call failed) — so counselling guidance is never
    missing from a report.
    """
    if risk_score >= 80:
        return [
            "High genetic risk detected.",
            "Immediate genetic counselling is strongly recommended.",
            "Prenatal genetic testing is strongly advised.",
            "Consult a clinical geneticist to evaluate CRISPR-based therapeutic options."
        ]

    elif risk_score >= 50:
        return [
            "Moderate genetic risk detected.",
            "Carrier screening is recommended for both parents.",
            "Prenatal diagnosis should be considered.",
            "Further molecular testing may improve clinical decision making."
        ]

    else:
        return [
            "Low genetic risk detected.",
            "Routine genetic screening is sufficient.",
            "Maintain regular prenatal follow-up.",
            "Continue preventive healthcare and family planning guidance."
        ]


def generate_counselling(result, risk_score, disease_name: str | None = None) -> list[str]:
    """
    Unchanged for existing callers that don't pass disease_name — falls
    straight back to the original fixed templates, so nothing breaks if
    this function is called exactly as before.

    NEW: if disease_name is provided, this first tries to generate real,
    LLM-personalized counselling notes grounded in the actual computed
    risk_score and inheritance probabilities (result["Healthy"],
    result["Carrier"], result["Affected"]) rather than only a risk
    bracket. If the LLM is unavailable or the call fails,
    generate_counselling_notes() returns None and this transparently
    falls back to _template_counselling() — counselling output is never
    empty or broken.
    """
    if disease_name:
        llm_notes = generate_counselling_notes(disease_name, risk_score, result)
        if llm_notes:
            return llm_notes

    return _template_counselling(risk_score)