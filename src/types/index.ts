import type { LucideIcon } from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface FeatureCard {
  icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  description: string;
}

export interface ProcessStep {
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface Testimonial {
  quote: string;
  initials: string;
  name: string;
  role: string;
}

export interface FooterLinkColumn {
  heading: string;
  links: NavLink[];
}

/* ------------------------------------------------------------------ */
/* App shell / navigation                                              */
/* ------------------------------------------------------------------ */

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/* ------------------------------------------------------------------ */
/* Auth forms                                                          */
/* ------------------------------------------------------------------ */

export type AuthFieldErrors = Record<string, string>;

export interface AuthFormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  errors: AuthFieldErrors;
  formError: string | null;
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                            */
/* ------------------------------------------------------------------ */

export type TrendDirection = "up" | "down" | "flat";

export interface MetricCardData {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
  trendValue?: string;
  trendDirection?: TrendDirection;
  accentClass: string;
}

export interface QuickActionData {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  accentClass: string;
}

export type AnalysisStatus = "completed" | "processing" | "queued" | "failed";

export interface AnalysisRecord {
  id: string;
  patientId: string;
  fileName: string;
  status: AnalysisStatus;
  prediction: string;
  confidence: number;
  date: string;
}

export type SystemHealthLevel = "operational" | "degraded" | "down";

export interface AiStatusData {
  modelStatus: string;
  datasetVersion: string;
  lastModelUpdate: string;
  systemHealth: SystemHealthLevel;
  backendStatus: SystemHealthLevel;
}

export interface ResearchArticle {
  id: string;
  title: string;
  category: string;
  publishedDate: string;
  url: string;
}

// Extended to cover every real notification type the backend can emit
// (see backend/app/schemas/notification_schema.py NOTIFICATION_TYPES),
// so DashboardPage.tsx can map real notifications directly into
// ActivityItem[] without lossy re-labeling. The original 4 values are
// kept for backward compatibility with anything still using them.
export type ActivityType =
  | "upload"
  | "analysis_started"
  | "report_downloaded"
  | "prediction_completed"
  | "dna_uploaded"
  | "dna_upload_failed"
  | "analysis_completed"
  | "analysis_failed"
  | "report_generated";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
}