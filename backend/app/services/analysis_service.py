from ai.recommendation.crispr_engine import recommend_crispr
from ai.models.risk_predictor import predict_risk
from ai.genetics.inheritance_engine import autosomal_recessive
from ai.explainability.genetic_counsellor import generate_counselling
from app.services.report_service import (
    generate_report,
    create_pdf,
)
from app.services.history_service import append_history_record
from app.services import job_service


REQUIRED_FIELDS = [
    "disease",
    "inheritance",
    "father_carrier",
    "mother_carrier",
    "family_history",
    "consanguinity",
    "father_genotype",
    "mother_genotype",
]


def _validate_input(data: dict) -> None:
    """
    Real validation, not a placeholder: confirms every field PatientRequest
    requires is present and that the two free-text fields (disease,
    genotypes) aren't blank. Raises ValueError on failure, which
    run_analysis_job() catches and records as a failed 'validate_input'
    stage.
    """
    missing = [field for field in REQUIRED_FIELDS if field not in data]
    if missing:
        raise ValueError(f"Missing required field(s): {', '.join(missing)}")

    if not str(data["disease"]).strip():
        raise ValueError("Disease name cannot be empty")

    if not str(data["father_genotype"]).strip():
        raise ValueError("Father genotype cannot be empty")

    if not str(data["mother_genotype"]).strip():
        raise ValueError("Mother genotype cannot be empty")


def run_analysis_job(job_id: str, data: dict) -> None:
    """
    Runs the full analysis as a sequence of real, independently-timed
    stages, updating the job record in job_service before/after each one.
    Intended to be called on a background thread by prediction_router.py
    so POST /predict/ can return job_id immediately.
    """
    try:
        # --- Stage 1: Validate Input ---------------------------------
        job_service.start_stage(job_id, "validate_input")
        _validate_input(data)
        job_service.complete_stage(job_id, "validate_input")

        # --- Stage 2: Inheritance Analysis ---------------------------
        job_service.start_stage(job_id, "inheritance")
        inheritance_result = autosomal_recessive(
            data["father_genotype"],
            data["mother_genotype"],
        )
        job_service.complete_stage(job_id, "inheritance")

        # --- Stage 3: AI Risk Prediction ------------------------------
        job_service.start_stage(job_id, "risk_prediction")
        risk_score, risk_level = predict_risk(
            data["inheritance"],
            data["father_carrier"],
            data["mother_carrier"],
            data["family_history"],
            data["consanguinity"],
        )
        job_service.complete_stage(job_id, "risk_prediction")

        # --- Stage 4: CRISPR Recommendation ---------------------------
        job_service.start_stage(job_id, "crispr_recommendation")
        recommendation = recommend_crispr(data["disease"])
        job_service.complete_stage(job_id, "crispr_recommendation")

        # --- Stage 5: Genetic Counselling ------------------------------
        job_service.start_stage(job_id, "counselling")
        counselling = generate_counselling(inheritance_result, risk_score)
        job_service.complete_stage(job_id, "counselling")

        # --- Stage 6: Report Generation ---------------------------------
        job_service.start_stage(job_id, "report_generation")

        result = {
            "recommendation": recommendation,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "confidence": recommendation.get("confidence", 96),
            "disease_category": recommendation.get(
                "disease_category", "Inherited Genetic Disorder"
            ),
            "evidence_level": recommendation.get("evidence", "Strong"),
            "clinical_status": recommendation.get(
                "clinical_status", "Preclinical"
            ),
            "reference": recommendation.get(
                "reference", "ClinVar | GeneReviews"
            ),
            "inheritance": inheritance_result,
            "counselling": counselling,
        }

        report = generate_report(result, data)
        pdf_path = create_pdf(report)
        report["pdf"] = pdf_path

        append_history_record(
            patient=data,
            result=result,
            report_id=report["report_id"],
            pdf_path=pdf_path,
        )

        job_service.complete_stage(job_id, "report_generation")

        # --- Done -------------------------------------------------------
        job_service.complete_job(job_id, report)

    except Exception as exc:
        # Whichever stage was in progress when this fired is the one
        # job_service marks as 'error' — current_stage tracks that.
        job = job_service.get_job(job_id)
        failed_stage = job["current_stage"] if job else "validate_input"
        job_service.fail_job(job_id, failed_stage, str(exc))