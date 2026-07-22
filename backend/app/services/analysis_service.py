import time

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
from app.services import notification_service


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

# Small, deliberate pause after each stage starts, purely so the frontend's
# stage-by-stage animation (AnalysisPipeline.tsx / DnaLoader) has time to
# actually render each step. The underlying computations below are all
# still real — this does not change what's computed, only how quickly the
# UI would otherwise blow past states that are genuinely happening but
# finish in milliseconds. 6 stages * 0.4s = ~2.4s total added latency.
STAGE_ANIMATION_DELAY_SECONDS = 0.4


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
    disease_name = data.get("disease", "Unknown disease")

    notification_service.create_notification(
        type="analysis_started",
        title="Analysis started",
        message=f"AI risk analysis started for {disease_name}.",
        link="/analysis",
    )

    try:
        # --- Stage 1: Validate Input ---------------------------------
        job_service.start_stage(job_id, "validate_input")
        time.sleep(STAGE_ANIMATION_DELAY_SECONDS)
        _validate_input(data)
        job_service.complete_stage(job_id, "validate_input")

        # --- Stage 2: Inheritance Analysis ---------------------------
        job_service.start_stage(job_id, "inheritance")
        time.sleep(STAGE_ANIMATION_DELAY_SECONDS)
        inheritance_result = autosomal_recessive(
            data["father_genotype"],
            data["mother_genotype"],
        )
        job_service.complete_stage(job_id, "inheritance")

        # --- Stage 3: AI Risk Prediction ------------------------------
        # FIX: now backed by the real trained model (see
        # ai/models/risk_predictor.py) instead of hardcoded point-scoring.
        # `disease` is now passed through too, since it's one of the
        # features the model was actually trained on.
        job_service.start_stage(job_id, "risk_prediction")
        time.sleep(STAGE_ANIMATION_DELAY_SECONDS)
        risk_score, risk_level = predict_risk(
            data["disease"],
            data["inheritance"],
            data["father_carrier"],
            data["mother_carrier"],
            data["family_history"],
            data["consanguinity"],
        )
        job_service.complete_stage(job_id, "risk_prediction")

        # --- Stage 4: CRISPR Recommendation ---------------------------
        # NEW: recommend_crispr() now also attempts to attach a real,
        # LLM-generated `ai_reasoning` explanation grounded in the
        # recommendation's own fields (see ai/services/
        # llm_enrichment_service.py). Falls back to no ai_reasoning
        # (rather than failing) if the LLM is unavailable.
        job_service.start_stage(job_id, "crispr_recommendation")
        time.sleep(STAGE_ANIMATION_DELAY_SECONDS)
        recommendation = recommend_crispr(data["disease"])
        job_service.complete_stage(job_id, "crispr_recommendation")

        # --- Stage 5: Genetic Counselling ------------------------------
        # NEW: disease_name is now passed through so
        # generate_counselling() can attempt real, LLM-personalized
        # counselling notes grounded in the actual risk_score and
        # inheritance probabilities, instead of only picking one of
        # three fixed templates by risk bracket. Falls back to the
        # original templates if the LLM is unavailable.
        job_service.start_stage(job_id, "counselling")
        time.sleep(STAGE_ANIMATION_DELAY_SECONDS)
        counselling = generate_counselling(inheritance_result, risk_score, data["disease"])
        job_service.complete_stage(job_id, "counselling")

        # --- Stage 6: Report Generation ---------------------------------
        job_service.start_stage(job_id, "report_generation")
        time.sleep(STAGE_ANIMATION_DELAY_SECONDS)

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

        notification_service.create_notification(
            type="report_generated",
            title="Report generated",
            message=f"A clinical report for {disease_name} is ready to view.",
            link="/reports",
        )

        # --- Done -------------------------------------------------------
        job_service.complete_job(job_id, report)

        notification_service.create_notification(
            type="analysis_completed",
            title="Analysis completed",
            message=f"AI risk analysis for {disease_name} finished - risk level: {risk_level}.",
            link="/analysis",
        )

    except Exception as exc:
        # Whichever stage was in progress when this fired is the one
        # job_service marks as 'error' — current_stage tracks that.
        job = job_service.get_job(job_id)
        failed_stage = job["current_stage"] if job else "validate_input"
        job_service.fail_job(job_id, failed_stage, str(exc))

        notification_service.create_notification(
            type="analysis_failed",
            title="Analysis failed",
            message=f"AI risk analysis for {disease_name} failed at the '{failed_stage}' stage: {str(exc)}",
            link="/analysis",
        )