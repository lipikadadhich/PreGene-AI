from ai.genetics.inheritance_engine import autosomal_recessive
from ai.explainability.genetic_counsellor import generate_counselling

father = input("Father Genotype (AA/Aa/aa): ")
mother = input("Mother Genotype (AA/Aa/aa): ")

result = autosomal_recessive(father, mother)

print("\nPrediction\n")

for k, v in result.items():
    print(f"{k}: {v}%")

print("\nAI Genetic Counselling\n")

advice = generate_counselling(result)

for line in advice:
    print("-", line)
