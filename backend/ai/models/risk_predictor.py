"""
risk_predictor.py

FIX: previously pure hardcoded point-scoring (+20 for this, +15 for that,
capped at 100, thresholded into HIGH/MEDIUM/LOW) — zero learning involved.
Now loads the actual trained Logistic Regression model (see
backend/ml/train_risk_model.py) and its fitted encoders, and runs real
inference on the same feature set the model was trained on:
Disease, Inheritance_Type, Father_Carrier, Mother_Carrier, Family_History,
Consanguinity.

Keeps the same external contract as before — predict_risk(...) still
returns (risk_score: int 0-100, risk_level: "HIGH"/"MEDIUM"/"LOW") — so
analysis_service.py's downstream logic (counselling, report generation,
etc.) doesn't need to change at all, aside from now also passing `disease`.
"""

import os

import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "ml", "models")

# Loaded once at import time, not per-request — these are small, cheap to
# keep in memory, and reloading from disk on every prediction would be
# wasteful.
_model = joblib.load(os.path.join(MODELS_DIR, "logistic_regression.pkl"))
_feature_encoder = joblib.load(os.path.join(MODELS_DIR, "feature_encoder.pkl"))
_label_encoder = joblib.load(os.path.join(MODELS_DIR, "label_encoder.pkl"))

# Must match the exact column order used in train_risk_model.py's
# FEATURE_COLS, since the fitted OneHotEncoder expects columns in this
# order.
FEATURE_COLUMNS = [
    "Disease",
    "Inheritance_Type",
    "Father_Carrier",
    "Mother_Carrier",
    "Family_History",
    "Consanguinity",
]

# Representative midpoint of each risk band, used to turn the model's
# class probabilities into a single continuous 0-100 score (rather than
# just returning a flat number for whichever class wins). This gives a
# more nuanced score that reflects model confidence, e.g. a prediction
# that's 55% Medium / 45% High produces a higher score than one that's
# 90% Medium / 10% High, even though both predict "Medium".
BAND_MIDPOINTS = {
    "Low": 20,
    "Medium": 55,
    "High": 90,
}


def _to_yes_no(value) -> str:
    """Training data encodes these fields as literal 'Yes'/'No' strings."""
    if isinstance(value, str):
        return "Yes" if value.strip().lower() in ("yes", "true", "1") else "No"
    return "Yes" if bool(value) else "No"


def predict_risk(
    disease,
    inheritance,
    father_carrier,
    mother_carrier,
    family_history,
    consanguinity,
):
    """
    Predict genetic risk score and risk level using the trained
    Logistic Regression model (backend/ml/models/logistic_regression.pkl).

    Returns:
        (risk_score: int in [0, 100], risk_level: "HIGH" | "MEDIUM" | "LOW")
    """
    input_row = pd.DataFrame(
        [
            {
                "Disease": disease,
                "Inheritance_Type": inheritance,
                "Father_Carrier": _to_yes_no(father_carrier),
                "Mother_Carrier": _to_yes_no(mother_carrier),
                "Family_History": _to_yes_no(family_history),
                "Consanguinity": _to_yes_no(consanguinity),
            }
        ],
        columns=FEATURE_COLUMNS,
    )

    # handle_unknown="ignore" was set when the encoder was fit, so a
    # disease name the model has never seen (very possible — the full
    # disease library has 2,400+ entries, the training set covered far
    # fewer) just produces an all-zero encoding for that feature rather
    # than raising an error. The model still predicts using the other
    # features (inheritance pattern, carrier status, family history,
    # consanguinity), which carry most of the real signal anyway.
    encoded = _feature_encoder.transform(input_row)

    probabilities = _model.predict_proba(encoded)[0]
    class_labels = _label_encoder.classes_  # e.g. ['High', 'Low', 'Medium']

    # Probability-weighted continuous score across all three bands.
    risk_score = sum(
        probabilities[i] * BAND_MIDPOINTS[class_labels[i]]
        for i in range(len(class_labels))
    )
    risk_score = int(round(min(max(risk_score, 0), 100)))

    predicted_class_index = probabilities.argmax()
    risk_level = class_labels[predicted_class_index].upper()  # "HIGH"/"MEDIUM"/"LOW"

    return risk_score, risk_level