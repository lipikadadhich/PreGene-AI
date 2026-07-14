from pathlib import Path

# --------------------------------------------------
# Backend Root
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

# --------------------------------------------------
# Directories
# --------------------------------------------------

DATASET_DIR = BASE_DIR / "datasets"
MODEL_DIR = BASE_DIR / "trained_models"
REPORT_DIR = BASE_DIR / "reports"

# --------------------------------------------------
# Dataset Files
# --------------------------------------------------

KNOWLEDGE_BASE = DATASET_DIR / "pregene_knowledge_base.csv"
MASTER_DATASET = DATASET_DIR / "pregene_master_dataset.csv"
TRAINING_DATASET = DATASET_DIR / "risk_training_dataset.csv"

# --------------------------------------------------
# Model Files
# --------------------------------------------------

RISK_MODEL = MODEL_DIR / "risk_model.pkl"