"""
generate_sequence_dataset.py

IMPORTANT — READ THIS FIRST:
This generates a SYNTHETIC dataset for training the DNA sequence CNN.
No real patient or public variant data is used here. This is documented
explicitly, not hidden, because presenting synthetic data as real would
be a form of fabrication.

Why synthetic: building a real pathogenicity classifier properly requires
labeled data from a source like ClinVar (NCBI's public database of
clinically-classified genetic variants) — that's a real project in itself
(downloading, parsing VCF-adjacent records, aligning sequence context
windows, handling class imbalance across tens of thousands of variants).
Given the timeline, this generates a smaller, controlled proxy dataset
instead, so the CNN architecture, training pipeline, and evaluation are
all genuinely real — only the underlying data is synthetic.

The synthetic design is not random noise — it's motivated by real biology:
  - "Pathogenic" sequences are more likely to contain:
      - premature stop codons (TAA, TAG, TGA) appearing early/mid-sequence
        (a real mechanism: nonsense mutations truncate the protein)
      - CpG dinucleotide depletion (pathogenic variants often disrupt
        CpG islands important for gene regulation)
      - specific short motifs at elevated frequency (standing in for
        known pathogenic k-mer patterns, e.g. splice-site disruptions)
  - "Benign" sequences have these patterns at background/baseline rates

This gives the CNN genuine sequence-level patterns to learn, rather than
memorizing random noise, while being fully transparent that it's a
constructed proxy task, not real clinical data.

UPGRADE PATH: replace this generator's output with real ClinVar variant
sequences (available at https://www.ncbi.nlm.nih.gov/clinvar/) for a
production-grade version of this model.

Run from backend/:
    python ml/generate_sequence_dataset.py
"""

import os
import random

import pandas as pd

random.seed(42)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_PATH = os.path.join(BASE_DIR, "datasets", "synthetic_sequence_dataset.csv")

SEQUENCE_LENGTH = 200
N_SAMPLES_PER_CLASS = 1500  # 3000 total — enough for a CNN to learn real patterns without needing GPU-scale training

BASES = ["A", "C", "G", "T"]
STOP_CODONS = ["TAA", "TAG", "TGA"]

# A handful of short synthetic "pathogenic-associated" motifs — standing
# in for real disruptive splice-site / regulatory motifs.
PATHOGENIC_MOTIFS = ["GATTACA", "CCGCGG", "TTAGGG"]


def random_sequence(length: int) -> str:
    return "".join(random.choice(BASES) for _ in range(length))


def insert_motif(sequence: str, motif: str) -> str:
    """Inserts a motif at a random position, replacing that stretch."""
    pos = random.randint(0, len(sequence) - len(motif))
    return sequence[:pos] + motif + sequence[pos + len(motif):]


def generate_pathogenic_sequence() -> str:
    seq = random_sequence(SEQUENCE_LENGTH)

    # Higher chance of an early/mid-sequence premature stop codon
    if random.random() < 0.6:
        stop = random.choice(STOP_CODONS)
        pos = random.randint(20, SEQUENCE_LENGTH // 2)
        seq = seq[:pos] + stop + seq[pos + 3:]

    # Higher chance of a disruptive motif
    if random.random() < 0.7:
        seq = insert_motif(seq, random.choice(PATHOGENIC_MOTIFS))

    # CpG depletion: remove some existing "CG" pairs by mutating the G
    seq = list(seq)
    for i in range(len(seq) - 1):
        if seq[i] == "C" and seq[i + 1] == "G" and random.random() < 0.5:
            seq[i + 1] = random.choice(["A", "T"])
    seq = "".join(seq)

    return seq


def generate_benign_sequence() -> str:
    seq = random_sequence(SEQUENCE_LENGTH)

    # Low background chance of the same features, so the model has to
    # learn a real frequency distinction, not a simple presence/absence
    # rule — a more realistic and harder learning task.
    if random.random() < 0.1:
        stop = random.choice(STOP_CODONS)
        pos = random.randint(20, SEQUENCE_LENGTH // 2)
        seq = seq[:pos] + stop + seq[pos + 3:]

    if random.random() < 0.05:
        seq = insert_motif(seq, random.choice(PATHOGENIC_MOTIFS))

    return seq


print(f"Generating {N_SAMPLES_PER_CLASS * 2} synthetic sequences...")

rows = []
for _ in range(N_SAMPLES_PER_CLASS):
    rows.append({"sequence": generate_pathogenic_sequence(), "label": "Pathogenic"})
for _ in range(N_SAMPLES_PER_CLASS):
    rows.append({"sequence": generate_benign_sequence(), "label": "Benign"})

df = pd.DataFrame(rows).sample(frac=1, random_state=42).reset_index(drop=True)  # shuffle

os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
df.to_csv(OUTPUT_PATH, index=False)

print(f"Saved {len(df)} sequences to {OUTPUT_PATH}")
print(df["label"].value_counts())