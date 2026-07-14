import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock

JOBS_FILE = Path("prediction_jobs.json")
MAX_JOBS = 50

# Each stage maps to one real, distinct unit of backend work in
# analysis_service.py / ai/pipeline/analysis_pipeline.py — no invented
# steps. Keep this list in sync with analyze() in analysis_service.py.
PIPELINE_STAGES = [
    "validate_input",         # field validation before any processing
    "inheritance",            # autosomal_recessive()
    "risk_prediction",        # predict_risk()
    "crispr_recommendation",  # recommend_crispr()
    "counselling",            # generate_counselling()
    "report_generation",      # generate_report() + create_pdf()
]

STATUS_PENDING = "pending"
STATUS_RUNNING = "running"
STATUS_COMPLETE = "complete"
STATUS_ERROR = "error"

# Guards read-modify-write of the flat file against races between the
# background analysis thread and incoming status-poll requests.
_lock = Lock()


def _load_jobs():
    if not JOBS_FILE.exists():
        return {}
    try:
        with open(JOBS_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def _save_jobs(jobs):
    with open(JOBS_FILE, "w") as f:
        json.dump(jobs, f, indent=2)


def _prune_old_jobs(jobs):
    """Keeps the flat file small by dropping the oldest jobs beyond MAX_JOBS."""
    if len(jobs) <= MAX_JOBS:
        return jobs

    ordered = sorted(
        jobs.items(),
        key=lambda item: item[1].get("created_at", ""),
        reverse=True,
    )
    return dict(ordered[:MAX_JOBS])


def create_job() -> str:
    """
    Creates a new job record with every stage set to 'pending' and returns
    its job_id. Called synchronously by the /predict/ route before the
    background thread starts, so a job_id is always available to return
    to the frontend immediately.
    """
    job_id = str(uuid.uuid4())

    with _lock:
        jobs = _load_jobs()

        jobs[job_id] = {
            "job_id": job_id,
            "overall_status": STATUS_PENDING,
            "stages": {stage: STATUS_PENDING for stage in PIPELINE_STAGES},
            "current_stage": None,
            "result": None,
            "error": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        jobs = _prune_old_jobs(jobs)
        _save_jobs(jobs)

    return job_id


def start_stage(job_id: str, stage: str) -> None:
    """Marks a stage as running and records it as the current stage."""
    with _lock:
        jobs = _load_jobs()
        job = jobs.get(job_id)
        if job is None:
            return

        job["stages"][stage] = STATUS_RUNNING
        job["current_stage"] = stage
        job["overall_status"] = STATUS_RUNNING
        job["updated_at"] = datetime.now(timezone.utc).isoformat()

        jobs[job_id] = job
        _save_jobs(jobs)


def complete_stage(job_id: str, stage: str) -> None:
    """Marks a single stage as complete (job overall_status stays 'running')."""
    with _lock:
        jobs = _load_jobs()
        job = jobs.get(job_id)
        if job is None:
            return

        job["stages"][stage] = STATUS_COMPLETE
        job["updated_at"] = datetime.now(timezone.utc).isoformat()

        jobs[job_id] = job
        _save_jobs(jobs)


def complete_job(job_id: str, result: dict) -> None:
    """Marks the whole job as complete and stores the final prediction result."""
    with _lock:
        jobs = _load_jobs()
        job = jobs.get(job_id)
        if job is None:
            return

        job["overall_status"] = STATUS_COMPLETE
        job["current_stage"] = None
        job["result"] = result
        job["updated_at"] = datetime.now(timezone.utc).isoformat()

        jobs[job_id] = job
        _save_jobs(jobs)


def fail_job(job_id: str, stage: str, error_message: str) -> None:
    """
    Marks the job as failed at a specific stage. The stage that was running
    when the exception occurred is marked 'error'; stages after it stay
    'pending' so the frontend can show exactly where it broke.
    """
    with _lock:
        jobs = _load_jobs()
        job = jobs.get(job_id)
        if job is None:
            return

        job["stages"][stage] = STATUS_ERROR
        job["overall_status"] = STATUS_ERROR
        job["current_stage"] = stage
        job["error"] = error_message
        job["updated_at"] = datetime.now(timezone.utc).isoformat()

        jobs[job_id] = job
        _save_jobs(jobs)


def get_job(job_id: str) -> dict | None:
    with _lock:
        jobs = _load_jobs()
        return jobs.get(job_id)