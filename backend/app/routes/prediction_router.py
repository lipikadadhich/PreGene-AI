import threading

from fastapi import APIRouter, HTTPException

from app.schemas.patient_schema import PatientRequest
from app.services.analysis_service import run_analysis_job
from app.services import job_service

router = APIRouter(
    prefix="/predict",
    tags=["Prediction"]
)


@router.post("/")
def predict(patient: PatientRequest):
    """
    Starts a prediction job and returns immediately with a job_id.
    The actual analysis (validate -> inheritance -> risk -> crispr ->
    counselling -> report) runs on a background thread; the frontend
    polls GET /predict/status/{job_id} for real progress.
    """
    job_id = job_service.create_job()

    thread = threading.Thread(
        target=run_analysis_job,
        args=(job_id, patient.model_dump()),
        daemon=True,
    )
    thread.start()

    return {"job_id": job_id}


@router.get("/status/{job_id}")
def get_status(job_id: str):
    """
    Returns the current state of a prediction job: overall_status,
    per-stage status dict, current_stage, and — once overall_status is
    'complete' — the final result (the same shape /predict/ used to
    return synchronously).
    """
    job = job_service.get_job(job_id)

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    return job