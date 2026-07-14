from ai.recommendation.knowledge_loader import KnowledgeBase

kb = KnowledgeBase()


def recommend_crispr(disease_name):

    disease = kb.get_disease(disease_name)

    if disease is None:
        # Always return the SAME shape as the "found" case below, just
        # with safe placeholder values, so downstream code (analysis
        # pipeline, PDF report builder, frontend) never has to guess
        # which fields exist. `available: False` is what the frontend
        # checks to show "CRISPR recommendation is currently unavailable
        # for this disease." instead of rendering placeholder data.
        return {
            "available": False,
            "message": "CRISPR recommendation is currently unavailable for this disease.",

            "disease": disease_name,

            "gene": None,
            "mutation": None,
            "editing_method": None,
            "clinical_status": None,
            "evidence": None,
            "success_rate": None,
            "inheritance_type": None,
            "ai_reasoning": None,
            "reference": None,

            # Frontend Fields
            "confidence": None,
            "disease_category": None,
        }

    return {
        "available": True,
        "message": None,

        "disease": disease["Disease"],

        "gene": disease["Gene"],

        "mutation": disease["Mutation_Type"],

        "editing_method": disease["CRISPR_Method"],

        "clinical_status": disease["Clinical_Status"],

        "evidence": disease["Evidence_Level"],

        "success_rate": disease["Success_Rate"],

        "inheritance_type": disease["Inheritance_Type"],

        "ai_reasoning": disease["AI_Reasoning"],

        "reference": disease["Reference"],

        # Frontend Fields
        "confidence": disease["Success_Rate"],

        "disease_category": disease["Inheritance_Type"]
    }