import joblib
import pandas as pd

from config import TRAINING_DATASET, RISK_MODEL

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report


# ---------------------------------------
# Load Dataset
# ---------------------------------------

df = pd.read_csv(TRAINING_DATASET)

print("=" * 60)
print("Training Dataset Loaded")
print("=" * 60)

print(df.head())


# ---------------------------------------
# Encode Categorical Features
# ---------------------------------------

encoders = {}

for column in df.columns:

    encoder = LabelEncoder()

    df[column] = encoder.fit_transform(df[column])

    encoders[column] = encoder


# ---------------------------------------
# Features & Target
# ---------------------------------------

X = df.drop(columns=["Risk_Level"])

y = df["Risk_Level"]


# ---------------------------------------
# Train/Test Split
# ---------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
)


# ---------------------------------------
# Train Random Forest
# ---------------------------------------

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)

model.fit(X_train, y_train)


# ---------------------------------------
# Evaluation
# ---------------------------------------

prediction = model.predict(X_test)

accuracy = accuracy_score(y_test, prediction)

print("\nAccuracy :", round(accuracy * 100, 2), "%")

print("\nClassification Report\n")

print(classification_report(y_test, prediction))


# ---------------------------------------
# Save Model
# ---------------------------------------

joblib.dump(model, RISK_MODEL)

print("\nModel Saved Successfully")

print("Location :", RISK_MODEL)
