import { Info } from "lucide-react";
import type { PredictionRecommendation } from "@/services/api";
import { getTierStyle } from "@/lib/evidenceTier";

interface CrisprEvidenceNoticeProps {
  recommendation: PredictionRecommendation;
}

/**
 * The single shared rendering for CRISPR recommendations that are NOT
 * backed by validated data — THEORETICAL_CANDIDATE or NO_KNOWN_STRATEGY.
 * Every place in the app that can show a CRISPR recommendation (Analysis
 * page, CRISPR Recommendations page, Report History view/compare) must
 * use this component for this state instead of re-implementing it, so
 * the presentation can never drift out of sync between pages.
 *
 * Renders: tier badge, gene(s) if known, confidence/tier label,
 * data source, and the backend-provided explanation. Deliberately never
 * renders Mutation / Editing Method / Success Rate — those fields are
 * only meaningful for validated tiers and would be misleading here.
 */
export default function CrisprEvidenceNotice({
  recommendation,
}: CrisprEvidenceNoticeProps) {
  const tierStyle = getTierStyle(recommendation.evidence_tier);
  const hasGene = Boolean(recommendation.gene);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${tierStyle.badgeClasses}`}
        >
          {tierStyle.label}
        </span>
      </div>

      {hasGene && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Associated Gene(s)
            </p>
            <p className="mt-1.5 break-words font-mono text-sm font-semibold text-slate-800">
              {recommendation.gene}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Data Source
            </p>
            <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">
              {recommendation.sources && recommendation.sources.length > 0
                ? recommendation.sources.join(", ")
                : "Project disease-gene library"}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <Info className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm leading-relaxed">
          {recommendation.explanation ||
            recommendation.message ||
            "CRISPR recommendation is currently unavailable for this disease."}
        </p>
      </div>
    </div>
  );
}