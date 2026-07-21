from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ai.models.dna_cnn_predictor import predict_sequence

router = APIRouter(prefix="/dna-analysis", tags=["DNA Analysis"])
dna_analysis_router = router


class SequenceRequest(BaseModel):
    sequence: str


@router.post("/predict")
def predict(request: SequenceRequest):
    """
    Classifies a DNA sequence (raw bases, or pasted FASTA content — a
    leading '>' header line is stripped automatically) as Pathogenic
    or Benign using the trained CNN. Model is lazy-loaded on first use
    to keep server startup memory low, same pattern as the RAG chatbot.
    """
    raw = request.sequence.strip()

    if not raw:
        raise HTTPException(status_code=400, detail="Sequence cannot be empty")

    # Strip a FASTA header line if present (starts with '>'), so users
    # can paste an entire FASTA file's content directly rather than
    # needing to manually extract just the sequence first.
    lines = raw.splitlines()
    sequence_lines = [line for line in lines if not line.startswith(">")]
    sequence = "".join(sequence_lines) if sequence_lines else raw

    try:
        result = predict_sequence(sequence)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
