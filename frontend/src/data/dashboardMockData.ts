import {
  BarChart3,
  AlertTriangle,
  Gauge,
  FileCheck2,
  Upload,
  FlaskConical,
  FileText,
  BookOpen,
} from "lucide-react";
import type {
  MetricCardData,
  QuickActionData,
  AnalysisRecord,
  AiStatusData,
  ResearchArticle,
  ActivityItem,
} from "@/types";

/**
 * All data below is mock data for UI development.
 * Replace each export with a real API call (e.g. via a hook like
 * `useDashboardMetrics()`) once the backend is available — the shapes
 * are defined in `@/types` so components don't need to change.
 */

export const DASHBOARD_METRICS: MetricCardData[] = [
  {
    id: "total-analyses",
    label: "Total Analyses",
    value: "1,284",
    icon: BarChart3,
    trendValue: "+12.4%",
    trendDirection: "up",
    accentClass: "bg-brand-50 text-brand-600",
  },
  {
    id: "high-risk-cases",
    label: "High Risk Cases",
    value: "37",
    icon: AlertTriangle,
    trendValue: "-3.1%",
    trendDirection: "down",
    accentClass: "bg-amber-50 text-amber-600",
  },
  {
    id: "avg-confidence",
    label: "Average AI Confidence",
    value: "96.8%",
    icon: Gauge,
    trendValue: "+0.6%",
    trendDirection: "up",
    accentClass: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "reports-generated",
    label: "Reports Generated",
    value: "842",
    icon: FileCheck2,
    trendValue: "+58",
    trendDirection: "up",
    accentClass: "bg-teal-50 text-teal-600",
  },
];

export const QUICK_ACTIONS: QuickActionData[] = [
  {
    id: "upload-dna",
    title: "Upload DNA File",
    description: "Add new sequencing or imaging data for screening.",
    icon: Upload,
    href: "/upload",
    accentClass: "bg-brand-50 text-brand-600",
  },
  {
    id: "start-analysis",
    title: "Start New Analysis",
    description: "Run AI-assisted genetic disorder prediction.",
    icon: FlaskConical,
    href: "/analysis",
    accentClass: "bg-teal-50 text-teal-600",
  },
  {
    id: "view-reports",
    title: "View Reports",
    description: "Browse and export completed clinical reports.",
    icon: FileText,
    href: "/reports",
    accentClass: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "research-library",
    title: "Research Library",
    description: "Explore the latest peer-reviewed genomics research.",
    icon: BookOpen,
    href: "/research",
    accentClass: "bg-amber-50 text-amber-600",
  },
];

export const RECENT_ANALYSES: AnalysisRecord[] = [
  {
    id: "an-1024",
    patientId: "PT-10492",
    fileName: "sequencing_batch_014.vcf",
    status: "completed",
    prediction: "Low Risk",
    confidence: 98.2,
    date: "2026-06-29",
  },
  {
    id: "an-1023",
    patientId: "PT-10488",
    fileName: "embryo_scan_009.dcm",
    status: "processing",
    prediction: "Pending",
    confidence: 0,
    date: "2026-06-29",
  },
  {
    id: "an-1022",
    patientId: "PT-10471",
    fileName: "sequencing_batch_013.vcf",
    status: "completed",
    prediction: "Moderate Risk",
    confidence: 91.4,
    date: "2026-06-28",
  },
  {
    id: "an-1021",
    patientId: "PT-10465",
    fileName: "sequencing_batch_012.vcf",
    status: "failed",
    prediction: "—",
    confidence: 0,
    date: "2026-06-27",
  },
  {
    id: "an-1020",
    patientId: "PT-10460",
    fileName: "embryo_scan_008.dcm",
    status: "queued",
    prediction: "Pending",
    confidence: 0,
    date: "2026-06-27",
  },
  {
    id: "an-1019",
    patientId: "PT-10452",
    fileName: "sequencing_batch_011.vcf",
    status: "completed",
    prediction: "High Risk",
    confidence: 94.7,
    date: "2026-06-26",
  },
];

export const AI_STATUS: AiStatusData = {
  modelStatus: "Active — v4.2.1",
  datasetVersion: "GenomeSet 2026.06",
  lastModelUpdate: "2 days ago",
  systemHealth: "operational",
  backendStatus: "operational",
};

export const RESEARCH_FEED: ResearchArticle[] = [
  {
    id: "res-1",
    title: "CRISPR-Cas9 precision editing in early-stage embryos: a 2026 review",
    category: "Gene Editing",
    publishedDate: "2026-06-25",
    url: "#",
  },
  {
    id: "res-2",
    title: "Machine learning models for polygenic risk scoring in reproductive medicine",
    category: "AI & Genomics",
    publishedDate: "2026-06-18",
    url: "#",
  },
  {
    id: "res-3",
    title: "Long-term outcomes of preimplantation genetic testing: a meta-analysis",
    category: "Clinical Research",
    publishedDate: "2026-06-10",
    url: "#",
  },
];

export const ACTIVITY_TIMELINE: ActivityItem[] = [
  {
    id: "act-1",
    type: "upload",
    description: "Uploaded DNA sequencing file for PT-10492",
    timestamp: "2026-06-29T14:32:00Z",
  },
  {
    id: "act-2",
    type: "analysis_started",
    description: "Started genetic analysis for PT-10488",
    timestamp: "2026-06-29T10:05:00Z",
  },
  {
    id: "act-3",
    type: "report_downloaded",
    description: "Downloaded clinical report for PT-10471",
    timestamp: "2026-06-28T16:47:00Z",
  },
  {
    id: "act-4",
    type: "prediction_completed",
    description: "Completed disorder prediction for PT-10452",
    timestamp: "2026-06-26T09:12:00Z",
  },
];
