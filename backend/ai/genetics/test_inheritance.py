from ai.genetics.inheritance_engine import autosomal_recessive

father = input("Father Genotype (AA/Aa/aa): ")
mother = input("Mother Genotype (AA/Aa/aa): ")

result = autosomal_recessive(father, mother)

print("\nPrediction\n")

for k, v in result.items():
    print(f"{k}: {v}%")
