def generate_counselling(result, risk_score):

    affected = result["Affected"]

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
