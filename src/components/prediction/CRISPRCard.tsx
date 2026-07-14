import { Scissors, Dna, Gauge } from "lucide-react";
import type { Recommendation } from "@/types/prediction";
import { getTierStyle } from "@/lib/evidenceTier";
import CrisprEvidenceNotice from "@/components/shared/CrisprEvidenceNotice";

interface CRISPRCardProps {
  recommendation: Recommendation;
}

/**
 * Displays the CRISPR gene-editing portion of a prediction result. For
 * curated/validated evidence tiers, shows gene, mutation, editing method,
 * and success rate as before. For theoretical/no-strategy tiers, renders
 * the shared CrisprEvidenceNotice — the same component used on every
 * other page that can show a CRISPR recommendation.
 */
export default function CRISPRCard({ recommendation }: CRISPRCardProps) {
  const isTotallyUnavailable = recommendation.available === false && !recommendation.gene;
  const tierStyle = getTierStyle(recommendation.evidence_tier);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r ${tierStyle.cardAccentClasses}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Scissors className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">
              CRISPR Recommendation
            </h3>
            <p className="mt-0.5 text-sm text-slate-400">
              Suggested precision gene-editing intervention.
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
        <div className="mt-6">
          <CrisprEvidenceNotice recommendation={recommendation} />
        </div>
      ) : tierStyle.hasValidatedDetails ? (
        <>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Target gene
              </dt>
              <dd className="mt-1 font-mono text-sm font-semibold text-slate-900">
                {recommendation.gene || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Mutation
              </dt>
              <dd className="mt-1 font-mono text-sm font-semibold text-slate-900">
                {recommendation.mutation || "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Editing method
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Dna className="h-4 w-4 text-brand-500" aria-hidden="true" />
                {recommendation.editing_method || "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <Gauge className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                Predicted success rate
              </span>
              <span className="font-semibold text-slate-900">
                {recommendation.success_rate ?? 0}%
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-700"
                style={{ width: `${recommendation.success_rate ?? 0}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="mt-6">
          <CrisprEvidenceNotice recommendation={recommendation} />
        </div>
      )}
    </div>
  );
}