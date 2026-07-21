"""
dna_cnn_predictor.py

Runs inference using the trained CNN (backend/ml/models/dna_cnn.pt) to
classify a DNA sequence as Pathogenic or Benign.

Lazy-loaded on first use, same pattern as rag_service.py, to keep
server startup memory low — this model only loads into memory the
first time someone actually requests a sequence analysis.
"""

import json
import os

import numpy as np
import torch
import torch.nn as nn

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "ml", "models")

BASE_TO_INDEX = {"A": 0, "C": 1, "G": 2, "T": 3}

_model = None
_classes = None
_expected_length = None


class DnaCNN(nn.Module):
    """Must exactly match the architecture in train_cnn_model.py, since
    we're loading its saved weights into this same structure."""

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
        x = self.global_pool(x).squeeze(-1)
        x = self.dropout(x)
        return self.fc(x)


def _ensure_loaded():
    global _model, _classes, _expected_length

    if _model is not None:
        return

    with open(os.path.join(MODELS_DIR, "dna_cnn_config.json")) as f:
        config = json.load(f)

    _classes = config["classes"]
    _expected_length = config["sequence_length"]

    _model = DnaCNN(n_classes=len(_classes))
    _model.load_state_dict(
        torch.load(os.path.join(MODELS_DIR, "dna_cnn.pt"), map_location="cpu")
    )
    _model.eval()


def one_hot_encode_sequence(sequence: str) -> np.ndarray:
    matrix = np.zeros((4, len(sequence)), dtype=np.float32)
    for i, base in enumerate(sequence):
        idx = BASE_TO_INDEX.get(base.upper())
        if idx is not None:
            matrix[idx, i] = 1.0
    return matrix


def clean_sequence(raw_sequence: str) -> str:
    """
    Strips whitespace/newlines and keeps only valid DNA base characters
    (A/C/G/T/N), so pasted FASTA content (which may include a header
    line starting with '>' or line breaks) can be handled reasonably —
    the '>' header line itself should be stripped by the caller before
    reaching this function.
    """
    return "".join(c for c in raw_sequence.upper() if c in "ACGTN")


def predict_sequence(sequence: str) -> dict:
    """
    Classifies a DNA sequence as Pathogenic or Benign.

    If the input isn't exactly the length the model was trained on
    (200bp), it's truncated or zero-padded to fit — a real production
    system would use a sliding window over long sequences instead, but
    for this proof-of-concept, a single fixed-length classification is
    sufficient and clearly documented.
    """
    _ensure_loaded()

    cleaned = clean_sequence(sequence)
    if len(cleaned) == 0:
        raise ValueError("No valid DNA bases (A/C/G/T) found in input")

    if len(cleaned) > _expected_length:
        cleaned = cleaned[:_expected_length]
    elif len(cleaned) < _expected_length:
        cleaned = cleaned + "N" * (_expected_length - len(cleaned))

    encoded = one_hot_encode_sequence(cleaned)
    input_tensor = torch.tensor(encoded, dtype=torch.float32).unsqueeze(0)  # add batch dim

    with torch.no_grad():
        logits = _model(input_tensor)
        probabilities = torch.softmax(logits, dim=1)[0]

    predicted_index = probabilities.argmax().item()
    predicted_class = _classes[predicted_index]
    confidence = probabilities[predicted_index].item()

    return {
        "prediction": predicted_class,
        "confidence": round(confidence * 100, 1),
        "probabilities": {
            _classes[i]: round(probabilities[i].item() * 100, 1)
            for i in range(len(_classes))
        },
        "sequence_length_analyzed": len(cleaned),
        "note": (
            "This model was trained on a synthetic dataset with "
            "biologically-motivated patterns, not real clinical variant "
            "data. Treat results as a proof-of-concept demonstration, "
            "not a clinical diagnosis."
        ),
    }