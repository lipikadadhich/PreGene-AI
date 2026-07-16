import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import AnalysisTable from "@/components/dashboard/AnalysisTable";
import StatusCard from "@/components/dashboard/StatusCard";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import EmptyState from "@/components/dashboard/EmptyState";
import {
  SkeletonCard,
  SkeletonTableRow,
  SkeletonTimelineItem,
} from "@/components/dashboard/SkeletonCard";
import {
  FlaskConical,
  Activity,
  Dna,
  BarChart3,
  Database,
  Upload,
  PieChart,
  Stethoscope,
} from "lucide-react";
import { QUICK_ACTIONS } from "@/data/dashboardMockData";
import {
  getDatasetStats,
  getHealthStatus,
  getAnalysisHistory,
  getNotifications,
  getReportList,
  type DatasetStatsResponse,
  type HealthResponse,
  type AnalysisHistoryRecord,
  type NotificationItem,
  type ReportListItem,
} from "@/services/api";
import type { MetricCardData, AiStatusData, AnalysisRecord, ActivityItem, ActivityType } from "@/types";

// TODO: replace with the authenticated user's name once auth is connected.
const CURRENT_USER_NAME = "Dr. Patel";

// ---------------------------------------------------------------------------
// Local presentational helpers
// Mirrors the CardAccent / SectionHeader pattern established in
// DiseasePredictionPage.tsx. That page defines these inline rather than as
// shared components, so this composition file follows the same convention
// locally rather than importing from a page file.
// ---------------------------------------------------------------------------

const cardAccentLine = {
  blue: "from-blue-400 via-blue-500 to-blue-600",
  emerald: "from-emerald-400 via-emerald-500 to-emerald-600",
  amber: "from-amber-400 via-amber-500 to-amber-600",
} as const;

const cardChip = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
} as const;

function CardTopAccent({ color }: { color: keyof typeof cardAccentLine }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r ${cardAccentLine[color]}`}
    />
  );
}

function CardSectionHeader({
  icon,
  color,
  title,
  description,
  id,
}: {
  icon: React.ReactNode;
  color: keyof typeof cardChip;
  title: string;
  description?: string;
  id: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3.5">
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${cardChip[color]}`}
      >
        {icon}
      </div>
      <div className="min-w-0 pt-0.5">
        <h2 id={id} className="text-[15px] font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-slate-400">{description}</p>
        )}
      </div>
    </div>
  );
}

function buildMetrics(stats: DatasetStatsResponse): MetricCardData[] {
  return [
    {
      id: "total-diseases",
      icon: Dna,
      accentClass: "bg-blue-50 text-blue-600",
      value: stats.total_diseases.toLocaleString(),
      label: "Diseases Covered",
    },
    {
      id: "total-genes",
      icon: FlaskConical,
      accentClass: "bg-purple-50 text-purple-500",
      value: stats.total_genes.toLocaleString(),
      label: "Genes Tracked",
    },
    {
      id: "total-records",
      icon: Database,
      accentClass: "bg-teal-50 text-teal-600",
      value: stats.total_records.toLocaleString(),
      label: "Dataset Records",
    },
    {
      id: "columns",
      icon: BarChart3,
      accentClass: "bg-amber-50 text-amber-500",
      value: stats.columns.length.toString(),
      label: "Data Fields",
    },
  ];
}

function buildStatus(health: HealthResponse | null, stats: DatasetStatsResponse | null): AiStatusData {
  const isHealthy = health?.status === "Healthy";
  return {
    modelStatus: isHealthy ? "Active" : "Unavailable",
    datasetVersion: stats ? `${stats.total_records.toLocaleString()} records` : "—",
    lastModelUpdate: "—",
    systemHealth: isHealthy ? "operational" : "down",
    backendStatus: isHealthy ? "operational" : "down",
  };
}

function toAnalysisRecords(history: AnalysisHistoryRecord[]): AnalysisRecord[] {
  return history.map((record, index) => ({
    id: `${record.timestamp}-${index}`,
    patientId: record.disease,
    fileName: "AI Risk Assessment",
    status: "completed",
    prediction: record.risk_level,
    confidence: record.risk_score,
    date: record.timestamp,
  }));
}

// Real notification -> ActivityItem mapping. ActivityType now includes
// every real notification type (see types/index.ts), so no re-labeling
// is needed — this is a direct, lossless mapping of real backend events.
function toActivityItems(notifications: NotificationItem[]): ActivityItem[] {
  return notifications.map((n) => ({
    id: n.id,
    type: n.type as ActivityType,
    description: n.message,
    timestamp: n.created_at,
  }));
}

const UPLOAD_ACTIVITY_TYPES = new Set(["dna_uploaded", "dna_upload_failed"]);

function riskLevelBucket(level: string | undefined): "low" | "medium" | "high" | "other" {
  const normalized = (level || "").toLowerCase();
  if (normalized.includes("high")) return "high";
  if (normalized.includes("medium") || normalized.includes("moderate")) return "medium";
  if (normalized.includes("low")) return "low";
  return "other";
}

function buildRiskDistribution(reports: ReportListItem[]) {
  const counts = { low: 0, medium: 0, high: 0, other: 0 };
  for (const report of reports) {
    counts[riskLevelBucket(report.risk_level)] += 1;
  }
  const total = reports.length || 1;
  return {
    counts,
    total: reports.length,
    percentages: {
      low: Math.round((counts.low / total) * 100),
      medium: Math.round((counts.medium / total) * 100),
      high: Math.round((counts.high / total) * 100),
    },
  };
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DatasetStatsResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [reports, setReports] = useState<ReportListItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      getDatasetStats(),
      getHealthStatus(),
      getAnalysisHistory(),
      getNotifications(),
      getReportList(),
    ]).then(([statsResult, healthResult, historyResult, notificationsResult, reportsResult]) => {
      if (cancelled) return;
      if (statsResult.status === "fulfilled") setStats(statsResult.value);
      if (healthResult.status === "fulfilled") setHealth(healthResult.value);
      if (historyResult.status === "fulfilled") setHistory(historyResult.value);
      if (notificationsResult.status === "fulfilled")
        setNotifications(notificationsResult.value.notifications);
      if (reportsResult.status === "fulfilled") setReports(reportsResult.value.reports);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = stats ? buildMetrics(stats) : [];
  const status = buildStatus(health, stats);
  const analysisRecords = toAnalysisRecords(history);

  const activityItems = useMemo(() => toActivityItems(notifications).slice(0, 6), [notifications]);

  const uploadItems = useMemo(
    () =>
      toActivityItems(notifications)
        .filter((item) => UPLOAD_ACTIVITY_TYPES.has(item.type))
        .slice(0, 5),
    [notifications]
  );

  const diseasesAnalysedCount = useMemo(
    () => new Set(reports.map((r) => r.disease)).size,
    [reports]
  );

  const riskDistribution = useMemo(() => buildRiskDistribution(reports), [reports]);

  return (
    <div>
      <PageHeader
        title="Clinical Dashboard"
        description={`Welcome, ${CURRENT_USER_NAME}. An overview of today's genetic assessments, analyses, and platform status.`}
      />

      {/* Quick actions */}
      <section aria-labelledby="quick-actions-heading" className="mb-8">
        <h2 id="quick-actions-heading" className="mb-4 text-lg font-semibold text-slate-900">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard key={action.id} action={action} />
          ))}
        </div>
      </section>

      {/* Overview metrics */}
      <section aria-labelledby="metrics-heading" className="mb-8">
        <h2 id="metrics-heading" className="mb-4 text-lg font-semibold text-slate-900">
          Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : metrics.map((metric) => <MetricCard key={metric.id} metric={metric} />)}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="flex flex-col gap-8 xl:col-span-2">
          {/* Recent analyses */}
          <section aria-labelledby="recent-analyses-heading">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="recent-analyses-heading" className="text-lg font-semibold text-slate-900">
                Recent Analyses
              </h2>
            </div>
            {isLoading ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
                <table className="w-full">
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonTableRow key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : analysisRecords.length > 0 ? (
              <AnalysisTable records={analysisRecords} />
            ) : (
              <EmptyState
                icon={FlaskConical}
                title="No analyses yet"
                description="Run your first AI risk assessment to see it appear here."
                actionLabel="Start Analysis"
              />
            )}
          </section>

          {/* Risk distribution + diseases analysed */}
          <section
            aria-labelledby="risk-distribution-heading"
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:p-8"
          >
            <CardTopAccent color="amber" />
            <CardSectionHeader
              id="risk-distribution-heading"
              icon={<PieChart className="h-5 w-5" />}
              color="amber"
              title="Risk Distribution"
              description="Risk levels across all generated reports."
            />

            {isLoading ? (
              <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            ) : riskDistribution.total === 0 ? (
              <p className="text-sm text-slate-400">
                No reports generated yet — risk distribution will appear once analyses are run.
              </p>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Stethoscope className="h-4 w-4 text-slate-400" />
                  <span>
                    <span className="font-semibold text-slate-900">{diseasesAnalysedCount}</span>{" "}
                    unique disease{diseasesAnalysedCount !== 1 ? "s" : ""} analysed across{" "}
                    <span className="font-semibold text-slate-900">{riskDistribution.total}</span>{" "}
                    report{riskDistribution.total !== 1 ? "s" : ""}
                  </span>
                </div>

                <div
                  className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100"
                  aria-hidden="true"
                >
                  <div
                    className="h-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${riskDistribution.percentages.low}%` }}
                  />
                  <div
                    className="h-full bg-amber-500 transition-all duration-700"
                    style={{ width: `${riskDistribution.percentages.medium}%` }}
                  />
                  <div
                    className="h-full bg-rose-500 transition-all duration-700"
                    style={{ width: `${riskDistribution.percentages.high}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">
                      Low <span className="font-semibold text-slate-900">{riskDistribution.counts.low}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-amber-500" />
                    <span className="text-slate-600">
                      Medium{" "}
                      <span className="font-semibold text-slate-900">{riskDistribution.counts.medium}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-rose-500" />
                    <span className="text-slate-600">
                      High <span className="font-semibold text-slate-900">{riskDistribution.counts.high}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-8">
          {/* AI status */}
          <StatusCard status={status} />

          {/* Recent uploads */}
          <section
            aria-labelledby="recent-uploads-heading"
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]"
          >
            <CardTopAccent color="blue" />
            <CardSectionHeader
              id="recent-uploads-heading"
              icon={<Upload className="h-5 w-5" />}
              color="blue"
              title="Recent Uploads"
              description="Latest DNA file upload activity."
            />
            {isLoading ? (
              <div className="flex flex-col gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonTimelineItem key={i} />
                ))}
              </div>
            ) : uploadItems.length > 0 ? (
              <ActivityTimeline items={uploadItems} />
            ) : (
              <p className="text-sm text-slate-400">No uploads yet.</p>
            )}
          </section>

          {/* Activity timeline */}
          <section
            aria-labelledby="activity-heading"
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]"
          >
            <CardTopAccent color="emerald" />
            <CardSectionHeader
              id="activity-heading"
              icon={<Activity className="h-5 w-5" />}
              color="emerald"
              title="Recent Activity"
              description="A log of uploads, analyses, and report activity."
            />
            {isLoading ? (
              <div className="flex flex-col gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonTimelineItem key={i} />
                ))}
              </div>
            ) : activityItems.length > 0 ? (
              <ActivityTimeline items={activityItems} />
            ) : (
              <p className="text-sm text-slate-400">No activity yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}