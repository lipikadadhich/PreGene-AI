import json
import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/ml-insights", tags=["ML Insights"])
ml_insights_router = router

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOGS_DIR = os.path.join(BASE_DIR, "ml", "training_logs")


def _load_json(filename: str):
    path = os.path.join(LOGS_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(
            status_code=404,
            detail=f"{filename} not found — has ml/train_risk_model.py been run yet?",
        )
    with open(path, encoding="utf-8") as f:
        return json.load(f)


@router.get("/metrics")
def get_metrics():
    """
    Model comparison: accuracy, weighted F1, and full classification
    report for Logistic Regression, Random Forest, and the Neural
    Network, plus which one was selected as the production model.
    """
    return _load_json("metrics.json")


@router.get("/epoch-history")
def get_epoch_history():
    """
    Per-epoch train/validation loss and accuracy for the neural network
    — the raw numbers behind the training curve, for an interactive
    chart on the frontend instead of a static image.
    """
    return _load_json("epoch_history.json")


@router.get("/confusion-matrix")
def get_confusion_matrix():
    """Serves the saved confusion matrix plot as an image."""
    path = os.path.join(LOGS_DIR, "confusion_matrix.png")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="confusion_matrix.png not found")
    return FileResponse(path, media_type="image/png")


@router.get("/loss-curve")
def get_loss_curve():
    """Serves the saved static loss/accuracy curve plot as an image (fallback if the interactive chart isn't used)."""
    path = os.path.join(LOGS_DIR, "loss_curve.png")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="loss_curve.png not found")
    return FileResponse(path, media_type="image/png")