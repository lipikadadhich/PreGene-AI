import { useMemo } from "react";
import {
  CheckCircle2,
  Loader2,
  Circle,
  AlertCircle,
  ClipboardCheck,
  GitBranch,
  Activity,
  Scissors,
  HeartPulse,
  FileText,
} from "lucide-react";
import type { PipelineStage, PredictionJobStatus } from "@/services/api";
import DnaLoader from "@/components/common/DnaLoader";

interface StageMeta {
  key: PipelineStage;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Order and labels here must match PIPELINE_STAGES in job_service.py —
// each one maps to a real backend function, not an invented step.
const STAGES: StageMeta[] = [
  {
    key: "validate_input",
    label: "Validate Input",
    description: "Checking patient and family details",
    icon: ClipboardCheck,
  },
  {
    key: "inheritance",
    label: "Inheritance Analysis",
    description: "Computing autosomal inheritance probability",
    icon: GitBranch,
  },
  {
    key: "risk_prediction",
    label: "AI Risk Prediction",
    description: "Scoring genetic disease risk",
    icon: Activity,
  },
  {
    key: "crispr_recommendation",
    label: "CRISPR Recommendation",
    description: "Matching a gene editing strategy",
    icon: Scissors,
  },
  {
    key: "counselling",
    label: "Genetic Counselling",
    description: "Generating guidance notes",
    icon: HeartPulse,
  },
  {
    key: "report_generation",
    label: "Report Generation",
    description: "Compiling the clinical report",
    icon: FileText,
  },
];

interface AnalysisPipelineProps {
  job: PredictionJobStatus;
}

export default function AnalysisPipeline({ job }: AnalysisPipelineProps) {
  const completedCount = useMemo(
    () => STAGES.filter((s) => job.stages[s.key] === "complete").length,
    [job.stages]
  );

  const progressPercent = Math.round((completedCount / STAGES.length) * 100);

  const currentStageLabel = useMemo(() => {
    const running = STAGES.find((s) => job.stages[s.key] === "running");
    return running?.label ?? "Analyzing genetic data...";
  }, [job.stages]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      {job.overall_status !== "error" && (
        <DnaLoader label={currentStageLabel} />
      )}

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Running Analysis
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {job.overall_status === "error"
              ? "The analysis stopped due to an error below."
              : "Each step below reflects real backend progress."}
          </p>
        </div>

        <div className="text-right">
          <span className="text-2xl font-semibold tabular-nums text-slate-900">
            {progressPercent}%
          </span>
        </div>
      </div>

      <div
        className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            job.overall_status === "error" ? "bg-red-500" : "bg-brand-500"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <ol className="space-y-3">
        {STAGES.map((stage) => {
          const status = job.stages[stage.key];
          const Icon = stage.icon;

          const isComplete = status === "complete";
          const isRunning = status === "running";
          const isError = status === "error";

          return (
            <li
              key={stage.key}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 ${
                isError
                  ? "border-red-200 bg-red-50"
                  : isRunning
                  ? "border-brand-200 bg-brand-50 shadow-sm ring-1 ring-brand-100"
                  : isComplete
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <span
                className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                  isError
                    ? "bg-red-100 text-red-600"
                    : isRunning
                    ? "bg-brand-100 text-brand-600"
                    : isComplete
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {isRunning && (
                  <span className="absolute inset-0 animate-ping rounded-xl bg-brand-300 opacity-40" />
                )}
                <Icon className="relative h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isError
                      ? "text-red-700"
                      : isRunning
                      ? "text-brand-700"
                      : isComplete
                      ? "text-emerald-700"
                      : "text-slate-500"
                  }`}
                >
                  {stage.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {isRunning ? "In progress..." : stage.description}
                </p>
              </div>

              <span className="flex-shrink-0" aria-hidden="true">
                {isError ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : isRunning ? (
                  <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                ) : isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-300" />
                )}
              </span>
            </li>
          );
        })}
      </ol>

      {job.overall_status === "error" && job.error && (
        <div className="mt-5 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm">{job.error}</span>
        </div>
      )}
    </div>
  );
}