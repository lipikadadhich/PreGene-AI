import {
  Gauge,
  Brain,
  ScrollText,
  ShieldCheck,
  Activity,
  Download,
  Printer,
  Tag,
  Clock,
} from "lucide-react";
import type { PredictionResult } from "@/types/prediction";
import CRISPRCard from "./CRISPRCard";

function riskTone(level: string | undefined) {
  const normalized = (level || "").toLowerCase();

  if (normalized.includes("high")) {
    return {
      text: "text-rose-600",
      bg: "bg-rose-50",
      bar: "bg-rose-600",
      badge: "bg-rose-100 text-rose-700",
    };
  }

  if (
    normalized.includes("medium") ||
    normalized.includes("moderate")
  ) {
    return {
      text: "text-amber-600",
      bg: "bg-amber-50",
      bar: "bg-amber-500",
      badge: "bg-amber-100 text-amber-700",
    };
  }

  if (normalized.includes("low")) {
    return {
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      bar: "bg-emerald-600",
      badge: "bg-emerald-100 text-emerald-700",
    };
  }

  return {
    text: "text-slate-600",
    bg: "bg-slate-50",
    bar: "bg-slate-500",
    badge: "bg-slate-100 text-slate-700",
  };
}

function InheritanceRow({
  label,
  value,
  colorClass,
  dotClass,
}: {
  label: string;
  value: number;
  colorClass: string;
  dotClass: string;
}) {
  const clamped = Math.max(0, Math.min(100, value || 0));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-slate-700">
          <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
          {label}
        </span>
        <span className="font-semibold tabular-nums text-slate-500">
          {value}%
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} probability`}
      >
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

interface RiskAssessmentPanelProps {
  result: PredictionResult;
}

export default function RiskAssessmentPanel({
  result,
}: RiskAssessmentPanelProps) {
  const tone = riskTone(result.risk_level);

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------- */}
      {/* Report header + actions                                    */}
      {/* ---------------------------------------------------------- */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {result.disease_category && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              <Tag className="h-3.5 w-3.5" />
              {result.disease_category}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            Generated {new Date().toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={!result.pdf}
            onClick={() =>
              window.open("https://pregene-ai.onrender.com/report/download", "_blank")
            }
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Risk overview (existing section, unchanged)                 */}
      {/* ---------------------------------------------------------- */}
      <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />

        <div className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tone.bg}`}
              >
                <Gauge className={`h-7 w-7 ${tone.text}`} />
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  AI Risk Assessment
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Clinical genetic risk analysis generated using the
                  PreGene-AI prediction engine.
                </p>
              </div>
            </div>

            <div
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tone.badge}`}
            >
              {result.risk_level}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-slate-600">
                  Risk Score
                </span>
              </div>

              <h3 className={`mt-5 text-4xl font-bold ${tone.text}`}>
                {result.risk_score}%
              </h3>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${tone.bar} transition-all duration-700`}
                  style={{ width: `${result.risk_score}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-slate-600">
                  AI Confidence
                </span>
              </div>

              <h3 className="mt-5 text-4xl font-bold text-emerald-600">
                {result.confidence ?? 90}%
              </h3>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${result.confidence ?? 90}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-slate-600">
                  Clinical Status
                </span>
              </div>

              <h3 className={`mt-5 text-2xl font-semibold ${tone.text}`}>
                {result.risk_level}
              </h3>

              <p className="mt-3 text-sm text-slate-500">
                Risk level estimated using inheritance pattern,
                parental genotype and family history.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* CRISPR recommendation (new)                                  */}
      {/* ---------------------------------------------------------- */}
      {result.recommendation && (
        <CRISPRCard recommendation={result.recommendation} />
      )}

      {/* ---------------------------------------------------------- */}
      {/* Inheritance probability (new)                                */}
      {/* ---------------------------------------------------------- */}
      {result.inheritance && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Inheritance Probability
              </h3>
              <p className="text-sm text-slate-500">
                Likelihood of each genetic outcome for offspring.
              </p>
            </div>
          </div>

          <div
            className="mb-6 flex h-3 w-full overflow-hidden rounded-full bg-slate-100"
            aria-hidden="true"
          >
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{
                width: `${Math.max(0, Math.min(100, result.inheritance.Healthy || 0))}%`,
              }}
            />
            <div
              className="h-full bg-amber-500 transition-all duration-700"
              style={{
                width: `${Math.max(0, Math.min(100, result.inheritance.Carrier || 0))}%`,
              }}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-700"
              style={{
                width: `${Math.max(0, Math.min(100, result.inheritance.Affected || 0))}%`,
              }}
            />
          </div>

          <div className="space-y-5">
            <InheritanceRow
              label="Healthy"
              value={result.inheritance.Healthy}
              colorClass="bg-emerald-500"
              dotClass="bg-emerald-500"
            />
            <InheritanceRow
              label="Carrier"
              value={result.inheritance.Carrier}
              colorClass="bg-amber-500"
              dotClass="bg-amber-500"
            />
            <InheritanceRow
              label="Affected"
              value={result.inheritance.Affected}
              colorClass="bg-rose-500"
              dotClass="bg-rose-500"
            />
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Counselling notes (existing section, unchanged)             */}
      {/* ---------------------------------------------------------- */}
      {result.counselling?.length > 0 && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
          <div className="mb-5 flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Genetic Counselling Notes
            </h3>
          </div>

          <div className="space-y-3">
            {result.counselling.map((note, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm"
              >
                <div className="mt-2 h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-sm leading-7 text-slate-600">{note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}