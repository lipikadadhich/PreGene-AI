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

export function usePrediction() {
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

    try {
      const { job_id } = await startPrediction(formData);

      pollRef.current = setInterval(async () => {
        try {
          const status = await getPredictionStatus(job_id);
          setJob(status);

          if (status.overall_status === "complete") {
            stopPolling();
            setResult(status.result as unknown as PredictionResult);
            setIsLoading(false);
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

  const resetForm = () => {
    stopPolling();
    setFormData(DEFAULT_PATIENT_FORM_DATA);
    setJob(null);
    setResult(null);
    setError("");
    setIsLoading(false);
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
  };
}