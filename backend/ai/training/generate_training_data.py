import random
import pandas as pd
from ai.utils.constants import (
    AUTOSOMAL_RECESSIVE,
    AUTOSOMAL_DOMINANT,
    X_LINKED_RECESSIVE,
    HIGH,
    MEDIUM,
    LOW,
)

from config import TRAINING_DATASET

# ---------------------------------------
# Disease List
# ---------------------------------------

diseases = [
    ("Sickle Cell Disease", AUTOSOMAL_RECESSIVE),
    ("Beta Thalassemia", AUTOSOMAL_RECESSIVE),
    ("Cystic Fibrosis", AUTOSOMAL_RECESSIVE),
    ("Duchenne Muscular Dystrophy", X_LINKED_RECESSIVE),
    ("Huntington Disease", AUTOSOMAL_DOMINANT),
    ("Hemophilia A", X_LINKED_RECESSIVE),
    ("Marfan Syndrome", AUTOSOMAL_DOMINANT),
    ("Tay-Sachs Disease", AUTOSOMAL_RECESSIVE),
    ("Phenylketonuria", AUTOSOMAL_RECESSIVE),
    ("Spinal Muscular Atrophy", AUTOSOMAL_RECESSIVE),
]

rows = []

# ---------------------------------------
# Generate Synthetic Dataset
# ---------------------------------------

for _ in range(500):

    disease, inheritance = random.choice(diseases)

    father = random.choice(["Yes", "No"])
    mother = random.choice(["Yes", "No"])
    history = random.choice(["Yes", "No"])
    consanguinity = random.choice(["Yes", "No"])

    score = 0
if inheritance == AUTOSOMAL_RECESSIVE:
    score += 20
elif inheritance == AUTOSOMAL_DOMINANT:
    score += 15
elif inheritance == X_LINKED_RECESSIVE:
    score += 18

    if father == "Yes":
        score += 20

    if mother == "Yes":
        score += 20

    if father == "Yes" and mother == "Yes":
        score += 25

    if history == "Yes":
        score += 10

    if consanguinity == "Yes":
        score += 5

    if score >= 75:
        risk = "High"
    elif score >= 40:
        risk = "Medium"
    else:
        risk = "Low"

    rows.append([
        disease,
        inheritance,
        father,
        mother,
        history,
        consanguinity,
        risk
    ])

df = pd.DataFrame(
    rows,
    columns=[
        "Disease",
        "Inheritance_Type",
        "Father_Carrier",
        "Mother_Carrier",
        "Family_History",
        "Consanguinity",
        "Risk_Level",
    ],
)

# ---------------------------------------
# Save Dataset
# ---------------------------------------

df.to_csv(TRAINING_DATASET, index=False)

print("=" * 60)
print("Training Dataset Generated Successfully")
print("=" * 60)

print(df.head())
print("\nShape:", df.shape)
print("\nSaved To:", TRAINING_DATASET)
