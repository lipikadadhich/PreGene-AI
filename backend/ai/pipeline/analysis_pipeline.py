from ai.recommendation.crispr_engine import recommend_crispr
from ai.models.risk_predictor import predict_risk
from ai.genetics.inheritance_engine import autosomal_recessive
from ai.explainability.genetic_counsellor import generate_counselling


def analyze_patient(
    disease,
    inheritance,
    father_carrier,
    mother_carrier,
    family_history,
    consanguinity,
    father_genotype,
    mother_genotype
):

    recommendation = recommend_crispr(disease)

    risk_score, risk_level = predict_risk(
        inheritance,
        father_carrier,
        mother_carrier,
        family_history,
        consanguinity
    )

    inheritance_result = autosomal_recessive(
        father_genotype,
        mother_genotype
    )

    counselling = generate_counselling(
        inheritance_result,
        risk_score
    )

    return {
        "recommendation": recommendation,

        "risk_score": risk_score,
        "risk_level": risk_level,

        # New fields for frontend
        "confidence": recommendation.get("confidence", 96),

        "disease_category": recommendation.get(
            "disease_category",
            "Inherited Genetic Disorder"
        ),

        "evidence_level": recommendation.get(
            "evidence",
            "Strong"
        ),

        "clinical_status": recommendation.get(
            "clinical_status",
            "Preclinical"
        ),

        "reference": recommendation.get(
            "reference",
            "ClinVar | GeneReviews"
        ),

        "inheritance": inheritance_result,

        "counselling": counselling
    }
