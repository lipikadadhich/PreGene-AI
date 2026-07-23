import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  startPrediction,
  getPredictionStatus,
  type PredictionJobStatus,
} from "@/services/api";
import type {
  PatientFormData,
  PredictionResult,
} from "@/types/prediction";
import { DEFAULT_PATIENT_FORM_DATA } from "@/types/prediction";

const POLL_INTERVAL_MS = 1000;

interface LocationState {
  prefill?: Partial<PatientFormData>;
}

interface UsePredictionOptions {
  /**
   * When true, the result is held (isResultReady flips true, but
   * `result` stays null) once the backend finishes, until the caller
   * explicitly calls revealResult(). Used by AnalysisPage so its
   * loading animation (AnalysisPipeline / DnaLoader) keeps playing
   * until the user clicks "View Results".
   *
   * Defaults to false so every OTHER page using this shared hook
   * (CrisprRecommendationsPage, DiseasePredictionPage, etc. — none of
   * which render a "View Results" button) keeps its original
   * behavior: `result` populates immediately once the backend
   * finishes, with no extra manual step.
   */
  holdResultUntilReveal?: boolean;
}

/**
 * Merges any fields passed via router state (e.g. from UploadPage after
 * a VCF was parsed) on top of the defaults. Only keys that are actually
 * present in `prefill` override the default — everything else stays at
 * its normal starting value, and the user can edit any of it before
 * submitting.
 */
function buildInitialFormData(prefill?: Partial<PatientFormData>): PatientFormData {
  if (!prefill) {
    return DEFAULT_PATIENT_FORM_DATA;
  }

  return {
    ...DEFAULT_PATIENT_FORM_DATA,
    ...prefill,
  };
}

export function usePrediction(options: UsePredictionOptions = {}) {
  const { holdResultUntilReveal = false } = options;

  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const prefill = locationState?.prefill;

  const [formData, setFormData] = useState<PatientFormData>(() =>
    buildInitialFormData(prefill)
  );

  // Names of fields that arrived pre-filled from an upload, so the UI
  // (PatientInputForm) can optionally show an "Auto-detected" badge
  // next to them. Recomputed only from the prefill that was present on
  // first render — editing a field afterwards doesn't remove its badge,
  // since the value genuinely did come from the upload originally.
  const [prefilledFields] = useState<(keyof PatientFormData)[]>(() =>
    prefill ? (Object.keys(prefill) as (keyof PatientFormData)[]) : []
  );

  const [job, setJob] = useState<PredictionJobStatus | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Only meaningfully used when holdResultUntilReveal is true. The
  // backend has finished (job.overall_status === "complete") but the
  // result hasn't been shown yet — the loading animation keeps playing
  // until the user calls revealResult(). This keeps holding the actual
  // finished result so nothing is lost while we wait for that click.
  const [isResultReady, setIsResultReady] = useState(false);
  const pendingResultRef = useRef<PredictionResult | null>(null);

  // Holds the interval id so it can be cleared from anywhere (poll success,
  // poll failure, or unmount) without stale-closure issues.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  // Safety net: stop polling if the component using this hook unmounts
  // mid-analysis (e.g. user navigates away).
  useEffect(() => {
    return () => stopPolling();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    const newValue =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : value;

    setFormData((prev: PatientFormData) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const runPrediction = async () => {
    stopPolling();

    setIsLoading(true);
    setError("");
    setResult(null);
    setJob(null);
    setIsResultReady(false);
    pendingResultRef.current = null;

    try {
      const { job_id } = await startPrediction(formData);

      pollRef.current = setInterval(async () => {
        try {
          const status = await getPredictionStatus(job_id);
          setJob(status);

          if (status.overall_status === "complete") {
            stopPolling();
            const finishedResult = status.result as unknown as PredictionResult;

            if (holdResultUntilReveal) {
              // Hold the result and keep isLoading true — the caller's
              // animation keeps playing until it explicitly calls
              // revealResult().
              pendingResultRef.current = finishedResult;
              setIsResultReady(true);
            } else {
              // Default behavior: show the result immediately, exactly
              // as this hook worked before the hold-until-reveal
              // feature was added for AnalysisPage.
              setResult(finishedResult);
              setIsLoading(false);
            }
          } else if (status.overall_status === "error") {
            stopPolling();
            setError(status.error || "Prediction failed. Please try again.");
            setIsLoading(false);
          }
          // if still "running"/"pending", keep polling
        } catch (pollErr) {
          console.error(pollErr);
          stopPolling();
          setError("Lost connection while checking analysis progress.");
          setIsLoading(false);
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      console.error(err);
      setError("Prediction failed. Please try again.");
      setIsLoading(false);
    }
  };

  /**
   * Called when the user clicks "View Results". Only relevant when
   * holdResultUntilReveal is true — swaps the held result into view and
   * stops the loading animation. No-op otherwise (result already shows
   * immediately in the default mode).
   */
  const revealResult = () => {
    if (!pendingResultRef.current) return;
    setResult(pendingResultRef.current);
    setIsLoading(false);
    setIsResultReady(false);
  };

  const resetForm = () => {
    stopPolling();
    setFormData(DEFAULT_PATIENT_FORM_DATA);
    setJob(null);
    setResult(null);
    setError("");
    setIsLoading(false);
    setIsResultReady(false);
    pendingResultRef.current = null;
  };

  return {
    formData,
    handleChange,
    job,
    result,
    isLoading,
    error,
    runPrediction,
    resetForm,
    setResult,
    prefilledFields,
    isResultReady,
    revealResult,
  };
}