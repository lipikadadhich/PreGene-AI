"""
llm_enrichment_service.py

Adds a real generative-AI layer on top of two currently rule-based /
templated parts of the pipeline:

  1. CRISPR recommendation reasoning (the `ai_reasoning` field already
     defined in the Recommendation type, previously left unpopulated).
  2. Genetic counselling notes (previously three fixed template blocks
     keyed only on a risk_score bracket).

Both functions are strictly GROUNDED: they pass the LLM the real,
already-computed clinical data (disease name, gene, evidence tier, risk
score, inheritance probabilities) and instruct it to explain/phrase that
data conversationally — never to invent new facts, statistics, or
recommendations beyond what the deterministic engines already produced.
This keeps the underlying clinical logic (evidence tiers, risk model,
inheritance math) as the source of truth; the LLM's job is explanation
and tone, not decision-making.

Both functions fail SAFE: if the LLM call fails for any reason (missing
API key, network issue, rate limit), they fall back to the original
deterministic text rather than raising - so a chatbot/LLM outage never
breaks the core analysis pipeline.

Requires GROQ_API_KEY (same variable already used by rag_service.py).
"""

import os

from groq import Groq

GROQ_MODEL = "llama-3.1-8b-instant"

_groq_client: Groq | None = None


def _get_groq_client() -> Groq | None:
    """
    Returns a cached Groq client, or None if no API key is configured.
    Callers treat None as "LLM enrichment unavailable" and fall back to
    deterministic text — this is deliberately non-raising so a missing
    key degrades gracefully instead of failing the whole analysis.
    """
    global _groq_client
    if _groq_client is not None:
        return _groq_client

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return None

    _groq_client = Groq(api_key=api_key)
    return _groq_client


def _call_llm(system_prompt: str, user_prompt: str, max_tokens: int = 300) -> str | None:
    client = _get_groq_client()
    if client is None:
        return None

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        print(f"[llm_enrichment_service] LLM call failed, falling back: {exc}")
        return None


def generate_crispr_reasoning(recommendation: dict, disease_name: str) -> str | None:
    """
    Generates a natural-language explanation of why the given CRISPR
    recommendation makes sense for this disease, grounded strictly in
    the fields already present on `recommendation` (gene, mutation,
    editing_method, evidence_tier, clinical_status, etc. — whatever the
    provider chain in crispr_recommendation_engine.py already returned).

    Returns None if the LLM is unavailable or the call fails — callers
    should treat None as "no ai_reasoning available" and simply omit the
    field, rather than showing a broken/fabricated explanation.
    """
    if not recommendation.get("available", True):
        # No real evidence exists for this disease at all - there is
        # nothing genuine to reason about, so don't ask the LLM to
        # invent a justification for an unavailable recommendation.
        return None

    system_prompt = (
        "You are a clinical genetics assistant explaining a CRISPR gene-"
        "editing recommendation to a genetic counselor. You are given "
        "the disease and the recommendation details that a curated "
        "clinical database already produced. Explain in 2-3 sentences "
        "why this approach is relevant for this disease, using ONLY the "
        "facts provided below — do not invent genes, success rates, "
        "trial names, or evidence that isn't given to you. Be clear, "
        "clinically appropriate, and concise."
    )

    facts = "\n".join(f"{key}: {value}" for key, value in recommendation.items() if value)
    user_prompt = f"Disease: {disease_name}\n\nRecommendation details:\n{facts}"

    return _call_llm(system_prompt, user_prompt, max_tokens=200)


def generate_counselling_notes(
    disease_name: str,
    risk_score: float,
    inheritance_result: dict,
) -> list[str] | None:
    """
    Generates personalized genetic counselling guidance grounded in the
    actual computed risk_score and inheritance probabilities (Healthy/
    Carrier/Affected percentages from the inheritance engine), instead
    of three fixed templates keyed only on a risk bracket.

    Returns None if the LLM is unavailable or the call fails — callers
    should fall back to the original templated generate_counselling()
    logic in that case, so counselling guidance is never missing.
    """
    system_prompt = (
        "You are a genetic counsellor drafting brief guidance notes for "
        "a couple who just received an AI-assisted hereditary disease "
        "risk assessment. You are given the disease name, the computed "
        "risk score (0-100), and the computed inheritance probabilities "
        "(Healthy / Carrier / Affected percentages for a future "
        "pregnancy). Write 3-4 short, clear guidance points (each a "
        "single sentence) appropriate to this specific risk level and "
        "these specific numbers. Ground every point in the numbers "
        "given — do not invent statistics, test names, or medical "
        "claims beyond standard genetic counselling practice (e.g. "
        "recommending carrier screening, prenatal testing, or "
        "specialist consultation is fine; inventing a specific drug, "
        "trial, or exact statistic is not). "
        "Return ONLY the guidance points, one per line, no numbering, "
        "no preamble."
    )

    user_prompt = (
        f"Disease: {disease_name}\n"
        f"Risk score: {risk_score}/100\n"
        f"Inheritance probabilities — "
        f"Healthy: {inheritance_result.get('Healthy')}%, "
        f"Carrier: {inheritance_result.get('Carrier')}%, "
        f"Affected: {inheritance_result.get('Affected')}%"
    )

    raw = _call_llm(system_prompt, user_prompt, max_tokens=300)
    if raw is None:
        return None

    # One guidance point per line; drop any accidental blank lines.
    points = [line.strip("-• ").strip() for line in raw.split("\n") if line.strip()]
    return points if points else None


def generate_disease_explanation(disease_data: dict) -> str | None:
    """
    Generates a plain-language explanation of a disease for the Disease
    Library page, grounded strictly in the dataset's own fields for that
    disease (Disease, Gene, Gene_Name, Age_Of_Onset, Inheritance_Type,
    and any other fields present in disease_data — whatever the dataset
    row actually contains). Does not invent new medical facts, drug
    names, statistics, or studies beyond what's in the given data plus
    genuinely general, well-established background knowledge about how
    that inheritance pattern or gene type generally works.

    Returns None if the LLM is unavailable or the call fails — callers
    should treat None as "explanation unavailable right now" and show a
    simple message, rather than a broken/fabricated one.
    """
    system_prompt = (
        "You are a genetics educator explaining a hereditary disease to "
        "a patient or prospective parent who has no medical background. "
        "You are given the disease's known data fields from a curated "
        "clinical dataset (gene, inheritance pattern, typical age of "
        "onset, etc.). Write a short, warm, plain-language explanation "
        "(3-4 sentences) covering what the condition is, what the "
        "affected gene does at a high level, and what the inheritance "
        "pattern means for family planning — using ONLY the fields "
        "given below, plus general, well-established genetics "
        "background knowledge (e.g. what 'autosomal recessive' means in "
        "general). Do not invent specific statistics, treatments, drug "
        "names, or studies that aren't part of general medical "
        "knowledge. If a field is missing, simply don't mention it "
        "rather than guessing."
    )

    facts = "\n".join(
        f"{key}: {value}" for key, value in disease_data.items() if value
    )
    user_prompt = f"Disease data:\n{facts}"

    return _call_llm(system_prompt, user_prompt, max_tokens=250)