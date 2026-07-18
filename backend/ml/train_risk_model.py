"""
train_risk_model.py

Trains a real, learned risk-prediction model on risk_training_dataset.csv,
replacing the rule-based/lookup logic previously used in the FastAPI
/predict route.

Trains and compares three models:
  1. Logistic Regression (baseline)
  2. Random Forest (stronger classical baseline)
  3. A small feedforward neural network in PyTorch (tracks real
     per-epoch loss/accuracy — this is the "epoch reflection" artifact)

Saves:
  - The best-performing model (by validation F1) as the production model
  - All three models' metrics for comparison in the frontend dashboard
  - Loss/accuracy curves (PNG) for the neural network
  - Confusion matrix (PNG) for the best model
  - The fitted encoders, so the FastAPI route can preprocess new input
    the same way at inference time

Run from backend/:
    python ml/train_risk_model.py
"""

import json
import os

import joblib
import matplotlib
matplotlib.use("Agg")  # no display needed, just saving PNGs
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, OneHotEncoder

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "datasets", "risk_training_dataset.csv")
MODELS_DIR = os.path.join(BASE_DIR, "ml", "models")
LOGS_DIR = os.path.join(BASE_DIR, "ml", "training_logs")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

RANDOM_STATE = 42

# ---------------------------------------------------------------------------
# 1. Load and preprocess data
# ---------------------------------------------------------------------------
print("Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} rows, columns: {list(df.columns)}")

FEATURE_COLS = [
    "Disease",
    "Inheritance_Type",
    "Father_Carrier",
    "Mother_Carrier",
    "Family_History",
    "Consanguinity",
]
TARGET_COL = "Risk_Level"

X_raw = df[FEATURE_COLS]
y_raw = df[TARGET_COL]

# Encode target labels (Low/Medium/High -> 0/1/2)
label_encoder = LabelEncoder()
y = label_encoder.fit_transform(y_raw)
print(f"Target classes: {list(label_encoder.classes_)}")

# One-hot encode categorical features. Disease has many unique values, so
# this expands to a wide (but sparse, fine for this dataset size) feature
# space. sparse_output=False keeps it as a dense array for simplicity.
encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
X = encoder.fit_transform(X_raw)
print(f"Encoded feature shape: {X.shape}")

# Stratified split so class proportions are preserved in train/test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
)
print(f"Train: {X_train.shape[0]} rows | Test: {X_test.shape[0]} rows")

all_metrics = {}


def evaluate_model(name, y_true, y_pred):
    acc = accuracy_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred, average="weighted")
    report = classification_report(
        y_true, y_pred, target_names=label_encoder.classes_, output_dict=True
    )
    print(f"\n--- {name} ---")
    print(f"Accuracy: {acc:.4f} | Weighted F1: {f1:.4f}")
    print(classification_report(y_true, y_pred, target_names=label_encoder.classes_))
    all_metrics[name] = {
        "accuracy": acc,
        "weighted_f1": f1,
        "classification_report": report,
    }
    return acc, f1


# ---------------------------------------------------------------------------
# 2. Logistic Regression (baseline)
# ---------------------------------------------------------------------------
print("\nTraining Logistic Regression...")
log_reg = LogisticRegression(max_iter=1000, random_state=RANDOM_STATE)
log_reg.fit(X_train, y_train)
lr_pred = log_reg.predict(X_test)
lr_acc, lr_f1 = evaluate_model("Logistic Regression", y_test, lr_pred)

# ---------------------------------------------------------------------------
# 3. Random Forest (stronger classical baseline)
# ---------------------------------------------------------------------------
print("\nTraining Random Forest...")
rf = RandomForestClassifier(
    n_estimators=200, max_depth=10, random_state=RANDOM_STATE
)
rf.fit(X_train, y_train)
rf_pred = rf.predict(X_test)
rf_acc, rf_f1 = evaluate_model("Random Forest", y_test, rf_pred)

# ---------------------------------------------------------------------------
# 4. Small PyTorch neural network — real epoch-by-epoch training
# ---------------------------------------------------------------------------
print("\nTraining Neural Network...")

X_train_t = torch.tensor(X_train, dtype=torch.float32)
y_train_t = torch.tensor(y_train, dtype=torch.long)
X_test_t = torch.tensor(X_test, dtype=torch.float32)
y_test_t = torch.tensor(y_test, dtype=torch.long)

n_features = X_train.shape[1]
n_classes = len(label_encoder.classes_)


class RiskNet(nn.Module):
    def __init__(self, in_features, n_classes):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, n_classes),
        )

    def forward(self, x):
        return self.net(x)


torch.manual_seed(RANDOM_STATE)
model = RiskNet(n_features, n_classes)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

EPOCHS = 100
train_losses = []
train_accuracies = []
val_losses = []
val_accuracies = []

for epoch in range(1, EPOCHS + 1):
    model.train()
    optimizer.zero_grad()
    outputs = model(X_train_t)
    loss = criterion(outputs, y_train_t)
    loss.backward()
    optimizer.step()

    train_preds = outputs.argmax(dim=1)
    train_acc = (train_preds == y_train_t).float().mean().item()
    train_losses.append(loss.item())
    train_accuracies.append(train_acc)

    model.eval()
    with torch.no_grad():
        val_outputs = model(X_test_t)
        val_loss = criterion(val_outputs, y_test_t).item()
        val_preds = val_outputs.argmax(dim=1)
        val_acc = (val_preds == y_test_t).float().mean().item()
    val_losses.append(val_loss)
    val_accuracies.append(val_acc)

    if epoch % 10 == 0 or epoch == 1:
        print(
            f"Epoch {epoch:3d}/{EPOCHS} | "
            f"train_loss={loss.item():.4f} train_acc={train_acc:.4f} | "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.4f}"
        )

model.eval()
with torch.no_grad():
    nn_pred = model(X_test_t).argmax(dim=1).numpy()
nn_acc, nn_f1 = evaluate_model("Neural Network", y_test, nn_pred)

# ---------------------------------------------------------------------------
# 5. Save epoch curves (the "epoch reflection" artifact)
# ---------------------------------------------------------------------------
print("\nSaving training curves...")
fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))

axes[0].plot(range(1, EPOCHS + 1), train_losses, label="Train Loss")
axes[0].plot(range(1, EPOCHS + 1), val_losses, label="Validation Loss")
axes[0].set_xlabel("Epoch")
axes[0].set_ylabel("Loss")
axes[0].set_title("Loss per Epoch")
axes[0].legend()
axes[0].grid(alpha=0.3)

axes[1].plot(range(1, EPOCHS + 1), train_accuracies, label="Train Accuracy")
axes[1].plot(range(1, EPOCHS + 1), val_accuracies, label="Validation Accuracy")
axes[1].set_xlabel("Epoch")
axes[1].set_ylabel("Accuracy")
axes[1].set_title("Accuracy per Epoch")
axes[1].legend()
axes[1].grid(alpha=0.3)

plt.tight_layout()
plt.savefig(os.path.join(LOGS_DIR, "loss_curve.png"), dpi=150)
plt.close()

# Save the raw per-epoch numbers too, so the frontend dashboard can plot
# these interactively instead of just showing a static PNG.
epoch_history = {
    "epochs": list(range(1, EPOCHS + 1)),
    "train_loss": train_losses,
    "val_loss": val_losses,
    "train_accuracy": train_accuracies,
    "val_accuracy": val_accuracies,
}
with open(os.path.join(LOGS_DIR, "epoch_history.json"), "w") as f:
    json.dump(epoch_history, f, indent=2)

# ---------------------------------------------------------------------------
# 6. Pick the best model by weighted F1, save confusion matrix for it
# ---------------------------------------------------------------------------
model_scores = {
    "logistic_regression": (lr_acc, lr_f1, lr_pred),
    "random_forest": (rf_acc, rf_f1, rf_pred),
    "neural_network": (nn_acc, nn_f1, nn_pred),
}
best_name = max(model_scores, key=lambda k: model_scores[k][1])
best_acc, best_f1, best_pred = model_scores[best_name]
print(f"\nBest model: {best_name} (F1={best_f1:.4f}, Accuracy={best_acc:.4f})")

cm = confusion_matrix(y_test, best_pred)
disp = ConfusionMatrixDisplay(
    confusion_matrix=cm, display_labels=label_encoder.classes_
)
disp.plot(cmap="Blues")
plt.title(f"Confusion Matrix — {best_name}")
plt.tight_layout()
plt.savefig(os.path.join(LOGS_DIR, "confusion_matrix.png"), dpi=150)
plt.close()

# ---------------------------------------------------------------------------
# 7. Save everything needed for inference + the dashboard
# ---------------------------------------------------------------------------
print("\nSaving models and artifacts...")

joblib.dump(log_reg, os.path.join(MODELS_DIR, "logistic_regression.pkl"))
joblib.dump(rf, os.path.join(MODELS_DIR, "random_forest.pkl"))
torch.save(model.state_dict(), os.path.join(MODELS_DIR, "neural_network.pt"))

joblib.dump(encoder, os.path.join(MODELS_DIR, "feature_encoder.pkl"))
joblib.dump(label_encoder, os.path.join(MODELS_DIR, "label_encoder.pkl"))

with open(os.path.join(MODELS_DIR, "best_model.json"), "w") as f:
    json.dump(
        {
            "best_model": best_name,
            "n_features": n_features,
            "n_classes": n_classes,
        },
        f,
        indent=2,
    )

all_metrics["comparison"] = {
    "logistic_regression": {"accuracy": lr_acc, "weighted_f1": lr_f1},
    "random_forest": {"accuracy": rf_acc, "weighted_f1": rf_f1},
    "neural_network": {"accuracy": nn_acc, "weighted_f1": nn_f1},
    "best_model": best_name,
}
with open(os.path.join(LOGS_DIR, "metrics.json"), "w") as f:
    json.dump(all_metrics, f, indent=2)

print("\nDone. Artifacts saved to:")
print(f"  Models:  {MODELS_DIR}")
print(f"  Logs:    {LOGS_DIR}")