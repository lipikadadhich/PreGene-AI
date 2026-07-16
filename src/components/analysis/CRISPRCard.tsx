import { Dna, Scissors, Percent, ShieldCheck, BookOpen, Info } from "lucide-react";
import type { PredictionRecommendation } from "@/services/api";
import { getTierStyle } from "@/lib/evidenceTier";
import CrisprEvidenceNotice from "@/components/shared/CrisprEvidenceNotice";

interface CRISPRCardProps {
  recommendation: PredictionRecommendation;
}

function StatusPill({ value }: { value?: string | null }) {
  if (!value) {
    return <span className="text-sm text-slate-300">—</span>;
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {value}
    </span>
  );
}

function Tile({
  label,
  value,
  mono,
  wide,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1.5 break-words text-sm font-semibold text-slate-800 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}

export default function CRISPRCard({ recommendation }: CRISPRCardProps) {
  const isTotallyUnavailable = recommendation.available === false && !recommendation.gene;
  const tierStyle = getTierStyle(recommendation.evidence_tier);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Dna className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              CRISPR Recommendation
            </h3>
            <p className="text-sm text-slate-500">
              Suggested gene editing approach based on the identified mutation.
            </p>
          </div>
        </div>

        {recommendation.evidence_tier && tierStyle.hasValidatedDetails && (
          <span
            className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${tierStyle.badgeClasses}`}
          >
            {tierStyle.label}
          </span>
        )}
      </div>

      {isTotallyUnavailable ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <Info className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">
            {recommendation.message ||
              "CRISPR recommendation is currently unavailable for this disease."}
          </p>
        </div>
      ) : tierStyle.hasValidatedDetails ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Tile label="Gene" value={recommendation.gene} mono wide />
            <Tile label="Mutation" value={recommendation.mutation} mono wide />
            <Tile
              label="Editing Method"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Scissors className="h-3.5 w-3.5 text-slate-400" />
                  {recommendation.editing_method}
                </span>
              }
            />
            <Tile
              label="Success Rate"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-slate-400" />
                  {recommendation.success_rate}%
                </span>
              }
            />
            <Tile
              label="Clinical Status"
              value={<StatusPill value={recommendation.clinical_status} />}
            />
            <Tile
              label="Evidence Level"
              value={<StatusPill value={recommendation.evidence} />}
            />
            {recommendation.reference && (
              <Tile
                label="Reference"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                    {recommendation.reference}
                  </span>
                }
                wide
              />
            )}
          </div>

          {recommendation.success_rate != null && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-700">
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
              Success rate reflects reported clinical/preclinical outcomes for this editing approach — not a guarantee for any individual patient.
            </div>
          )}
        </>
      ) : (
        <CrisprEvidenceNotice recommendation={recommendation} />
      )}
    </div>
  );
}