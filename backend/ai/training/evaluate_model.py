import pandas as pd
import os

DATASET_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "datasets",
    "pregene_master_dataset.csv"
)

df = pd.read_csv(DATASET_PATH)

print("="*60)
print("PreGene-AI Exploratory Data Analysis")
print("="*60)

print("\nInheritance Types\n")
print(df["Inheritance_Type"].value_counts(dropna=False))

print("\nAge Of Onset\n")
print(df["Age_Of_Onset"].value_counts(dropna=False))

print("\nTop 20 Genes\n")
print(df["Gene"].value_counts().head(20))

print("\nTop 20 Diseases\n")
print(df["Disease"].value_counts().head(20))
