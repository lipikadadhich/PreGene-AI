"""
train_cnn_model.py

Trains a 1D Convolutional Neural Network to classify DNA sequences as
Pathogenic or Benign, using the synthetic dataset from
generate_sequence_dataset.py.

Architecture: sequences are one-hot encoded (A/C/G/T -> 4 channels) and
fed through stacked Conv1d layers, which learn to detect local sequence
motifs (the same principle used in real genomic deep learning models
like DeepSEA/DanQ, just at a much smaller scale here) regardless of
their exact position in the sequence — this is the actual reason CNNs
suit sequence data: they detect a learned pattern anywhere it appears,
not just at a fixed position.

Saves the trained model, per-epoch training curves, confusion matrix,
and metrics — same rigor as train_risk_model.py in Phase 1.

Run from backend/:
    python ml/train_cnn_model.py
"""

import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "datasets", "synthetic_sequence_dataset.csv")
MODELS_DIR = os.path.join(BASE_DIR, "ml", "models")
LOGS_DIR = os.path.join(BASE_DIR, "ml", "training_logs")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

RANDOM_STATE = 42
BASE_TO_INDEX = {"A": 0, "C": 1, "G": 2, "T": 3}


def one_hot_encode_sequence(sequence: str) -> np.ndarray:
    """
    Converts a DNA sequence string into a (4, seq_len) one-hot matrix —
    4 channels (A, C, G, T), like an image's RGB channels but for bases.
    Unknown characters (e.g. 'N' for ambiguous base calls) get an
    all-zero column rather than crashing, so real-world messy sequences
    don't break inference later.
    """
    matrix = np.zeros((4, len(sequence)), dtype=np.float32)
    for i, base in enumerate(sequence):
        idx = BASE_TO_INDEX.get(base.upper())
        if idx is not None:
            matrix[idx, i] = 1.0
    return matrix


print("Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} sequences, length {df['sequence'].str.len().iloc[0]}bp each")

label_encoder = LabelEncoder()
y = label_encoder.fit_transform(df["label"])
print(f"Classes: {list(label_encoder.classes_)}")

print("One-hot encoding sequences...")
X = np.stack([one_hot_encode_sequence(seq) for seq in df["sequence"]])
print(f"Encoded shape: {X.shape}  (samples, channels, sequence_length)")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
)
print(f"Train: {X_train.shape[0]} | Test: {X_test.shape[0]}")

X_train_t = torch.tensor(X_train, dtype=torch.float32)
y_train_t = torch.tensor(y_train, dtype=torch.long)
X_test_t = torch.tensor(X_test, dtype=torch.float32)
y_test_t = torch.tensor(y_test, dtype=torch.long)


class DnaCNN(nn.Module):
    """
    Two convolutional blocks (Conv1d -> ReLU -> MaxPool) followed by a
    global pooling + dense classifier. Each conv layer learns to detect
    short local sequence motifs; stacking two lets the network combine
    simple motifs into slightly more complex patterns, similar in spirit
    to how CNNs build up from edges to shapes in image classification.
    """

    def __init__(self, n_classes: int):
        super().__init__()
        self.conv1 = nn.Conv1d(in_channels=4, out_channels=32, kernel_size=8, padding=4)
        self.conv2 = nn.Conv1d(in_channels=32, out_channels=64, kernel_size=8, padding=4)
        self.pool = nn.MaxPool1d(kernel_size=2)
        self.global_pool = nn.AdaptiveMaxPool1d(1)
        self.dropout = nn.Dropout(0.3)
        self.fc = nn.Linear(64, n_classes)

    def forward(self, x):
        x = self.pool(torch.relu(self.conv1(x)))
        x = self.pool(torch.relu(self.conv2(x)))
        x = self.global_pool(x).squeeze(-1)  # (batch, 64)
        x = self.dropout(x)
        return self.fc(x)


torch.manual_seed(RANDOM_STATE)
n_classes = len(label_encoder.classes_)
model = DnaCNN(n_classes)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

EPOCHS = 40
BATCH_SIZE = 64
n_train = X_train_t.shape[0]

train_losses, train_accuracies = [], []
val_losses, val_accuracies = [], []

print("\nTraining CNN...")
for epoch in range(1, EPOCHS + 1):
    model.train()
    permutation = torch.randperm(n_train)
    epoch_loss = 0.0
    correct = 0

    for i in range(0, n_train, BATCH_SIZE):
        indices = permutation[i:i + BATCH_SIZE]
        batch_x, batch_y = X_train_t[indices], y_train_t[indices]

        optimizer.zero_grad()
        outputs = model(batch_x)
        loss = criterion(outputs, batch_y)
        loss.backward()
        optimizer.step()

        epoch_loss += loss.item() * len(indices)
        correct += (outputs.argmax(dim=1) == batch_y).sum().item()

    train_loss = epoch_loss / n_train
    train_acc = correct / n_train
    train_losses.append(train_loss)
    train_accuracies.append(train_acc)

    model.eval()
    with torch.no_grad():
        val_outputs = model(X_test_t)
        val_loss = criterion(val_outputs, y_test_t).item()
        val_preds = val_outputs.argmax(dim=1)
        val_acc = (val_preds == y_test_t).float().mean().item()
    val_losses.append(val_loss)
    val_accuracies.append(val_acc)

    if epoch % 5 == 0 or epoch == 1:
        print(
            f"Epoch {epoch:3d}/{EPOCHS} | "
            f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} | "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.4f}"
        )

model.eval()
with torch.no_grad():
    final_preds = model(X_test_t).argmax(dim=1).numpy()

acc = accuracy_score(y_test, final_preds)
f1 = f1_score(y_test, final_preds, average="weighted")
print(f"\nFinal test accuracy: {acc:.4f} | Weighted F1: {f1:.4f}")
print(classification_report(y_test, final_preds, target_names=label_encoder.classes_))

print("\nSaving training curves...")
fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))

axes[0].plot(range(1, EPOCHS + 1), train_losses, label="Train Loss")
axes[0].plot(range(1, EPOCHS + 1), val_losses, label="Validation Loss")
axes[0].set_xlabel("Epoch")
axes[0].set_ylabel("Loss")
axes[0].set_title("CNN Loss per Epoch")
axes[0].legend()
axes[0].grid(alpha=0.3)

axes[1].plot(range(1, EPOCHS + 1), train_accuracies, label="Train Accuracy")
axes[1].plot(range(1, EPOCHS + 1), val_accuracies, label="Validation Accuracy")
axes[1].set_xlabel("Epoch")
axes[1].set_ylabel("Accuracy")
axes[1].set_title("CNN Accuracy per Epoch")
axes[1].legend()
axes[1].grid(alpha=0.3)

plt.tight_layout()
plt.savefig(os.path.join(LOGS_DIR, "cnn_loss_curve.png"), dpi=150)
plt.close()

epoch_history = {
    "epochs": list(range(1, EPOCHS + 1)),
    "train_loss": train_losses,
    "val_loss": val_losses,
    "train_accuracy": train_accuracies,
    "val_accuracy": val_accuracies,
}
with open(os.path.join(LOGS_DIR, "cnn_epoch_history.json"), "w") as f:
    json.dump(epoch_history, f, indent=2)

cm = confusion_matrix(y_test, final_preds)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=label_encoder.classes_)
disp.plot(cmap="Purples")
plt.title("CNN Confusion Matrix — DNA Sequence Pathogenicity")
plt.tight_layout()
plt.savefig(os.path.join(LOGS_DIR, "cnn_confusion_matrix.png"), dpi=150)
plt.close()

print("\nSaving model and artifacts...")
torch.save(model.state_dict(), os.path.join(MODELS_DIR, "dna_cnn.pt"))

with open(os.path.join(MODELS_DIR, "dna_cnn_config.json"), "w") as f:
    json.dump(
        {
            "classes": list(label_encoder.classes_),
            "sequence_length": len(df["sequence"].iloc[0]),
        },
        f,
        indent=2,
    )

with open(os.path.join(LOGS_DIR, "cnn_metrics.json"), "w") as f:
    json.dump(
        {
            "accuracy": acc,
            "weighted_f1": f1,
            "classification_report": classification_report(
                y_test, final_preds, target_names=label_encoder.classes_, output_dict=True
            ),
            "note": (
                "Trained on a SYNTHETIC dataset with biologically-motivated "
                "motif patterns (premature stop codons, CpG depletion, "
                "disruptive short motifs) — not real clinical variant data. "
                "See generate_sequence_dataset.py for full documentation "
                "and the real-data upgrade path (ClinVar)."
            ),
        },
        f,
        indent=2,
    )

print("\nDone. Artifacts saved to:")
print(f"  Models: {MODELS_DIR}")
print(f"  Logs:   {LOGS_DIR}")
