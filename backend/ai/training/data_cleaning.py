import pandas as pd

from config import MASTER_DATASET


# ---------------------------------------
# Load Dataset
# ---------------------------------------

df = pd.read_csv(MASTER_DATASET)

print("=" * 60)
print("PreGene-AI Dataset Loaded Successfully")
print("=" * 60)


# ---------------------------------------
# Dataset Information
# ---------------------------------------

print("\nShape")
print(df.shape)

print("\nColumns")
print(df.columns.tolist())

print("\nData Types")
print(df.dtypes)

print("\nMissing Values")
print(df.isnull().sum())

print("\nDuplicate Rows")
print(df.duplicated().sum())


# ---------------------------------------
# Cleaning
# ---------------------------------------

df = df.drop_duplicates()

df = df.dropna(how="all")


# ---------------------------------------
# Final Dataset
# ---------------------------------------

print("\nFinal Shape")
print(df.shape)

print("\nFirst Five Records")

print(df.head())

print("\nCleaning Completed Successfully")
