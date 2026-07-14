from ai.pipeline.analysis_pipeline import analyze_patient

result = analyze_patient(

    disease="Sickle Cell Disease",

    inheritance="Autosomal Recessive",

    father_carrier=True,
    mother_carrier=True,

    family_history=True,

    consanguinity=False,

    father_genotype="Aa",
    mother_genotype="Aa"

)

print("\n========== PREGENE-AI REPORT ==========\n")

print(result["recommendation"])

print("\nRisk Score :", result["risk_score"])

print("Risk Level :", result["risk_level"])

print("\nInheritance")

for k, v in result["inheritance"].items():
    print(f"{k}: {v}%")

print("\nAI Counselling")

for line in result["counselling"]:
    print("-", line)
