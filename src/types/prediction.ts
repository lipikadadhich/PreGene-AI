// ---------------------------------------------------------------------------
// Shared prediction types
//
// DiseasePredictionPage.tsx defines its own local copies of these shapes
// (it's the reference implementation and is intentionally left untouched).
// This file exists so the newer pages built on top of the same /predict/
// endpoint — AI Risk Assessment, CRISPR Recommendations, Disease Library —
// can share one definition instead of redeclaring it three more times.
// ---------------------------------------------------------------------------

export interface PatientFormData {
  disease: string;
  inheritance: string;
  father_carrier: boolean;
  mother_carrier: boolean;
  family_history: boolean;
  consanguinity: boolean;
  father_genotype: string;
  mother_genotype: string;
}

export interface Recommendation {
  gene: string;
  mutation: string;
  editing_method: string;
  success_rate: number;
  clinical_status?: string;
  evidence?: string;
  reference?: string;
  confidence?: number;
  disease_category?: string;
  inheritance_type?: string;
  ai_reasoning?: string;
}

export interface InheritanceProbability {
  Healthy: number;
  Carrier: number;
  Affected: number;
}

export interface PredictionResult {
  risk_score: number;
  risk_level: string;
  confidence?: number;
  disease_category?: string;
  recommendation: Recommendation;
  inheritance: InheritanceProbability;
  counselling: string[];
  pdf?: string;
}

export const DEFAULT_PATIENT_FORM_DATA: PatientFormData = {
  disease: "",
  inheritance: "Autosomal Recessive",
  father_carrier: false,
  mother_carrier: false,
  family_history: false,
  consanguinity: false,
  father_genotype: "Aa",
  mother_genotype: "Aa",
};