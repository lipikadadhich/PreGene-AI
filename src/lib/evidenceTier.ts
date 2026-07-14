import type { EvidenceTier } from "@/services/api";

export interface TierStyle {
  label: string;
  badgeClasses: string;
  cardAccentClasses: string;
  /** True for tiers backed by curated/validated data (rich card: gene,
   *  mutation, editing method, success rate, progress bar all real). */
  hasValidatedDetails: boolean;
}

const TIER_STYLES: Record<EvidenceTier, TierStyle> = {
  FDA_APPROVED: {
    label: "FDA Approved",
    badgeClasses: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cardAccentClasses: "from-emerald-400 via-emerald-500 to-emerald-600",
    hasValidatedDetails: true,
  },
  CLINICAL_TRIAL: {
    label: "Clinical Trial",
    badgeClasses: "bg-sky-100 text-sky-800 border-sky-200",
    cardAccentClasses: "from-sky-400 via-sky-500 to-sky-600",
    hasValidatedDetails: true,
  },
  STRONG_PRECLINICAL: {
    label: "Strong Preclinical Evidence",
    badgeClasses: "bg-brand-100 text-brand-800 border-brand-200",
    cardAccentClasses: "from-brand-400 via-brand-500 to-brand-600",
    hasValidatedDetails: true,
  },
  EXPERIMENTAL: {
    label: "Experimental",
    badgeClasses: "bg-purple-100 text-purple-800 border-purple-200",
    cardAccentClasses: "from-purple-400 via-purple-500 to-purple-600",
    hasValidatedDetails: true,
  },
  THEORETICAL_CANDIDATE: {
    label: "Theoretical Candidate",
    badgeClasses: "bg-amber-100 text-amber-800 border-amber-200",
    cardAccentClasses: "from-amber-400 via-amber-500 to-amber-600",
    hasValidatedDetails: false,
  },
  NO_KNOWN_STRATEGY: {
    label: "No Known Strategy",
    badgeClasses: "bg-slate-100 text-slate-600 border-slate-200",
    cardAccentClasses: "from-slate-300 via-slate-400 to-slate-500",
    hasValidatedDetails: false,
  },
};

const DEFAULT_TIER_STYLE: TierStyle = TIER_STYLES.NO_KNOWN_STRATEGY;

/**
 * Resolves a tier to its display style. Falls back to the
 * NO_KNOWN_STRATEGY style for any unrecognized/missing tier value,
 * rather than throwing — old data or a future backend tier this frontend
 * doesn't know about yet should degrade safely, not crash the card.
 */
export function getTierStyle(tier: EvidenceTier | undefined | null): TierStyle {
  if (!tier) return DEFAULT_TIER_STYLE;
  return TIER_STYLES[tier] || DEFAULT_TIER_STYLE;
}