import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import AnalysisTable from "@/components/dashboard/AnalysisTable";
import StatusCard from "@/components/dashboard/StatusCard";
import ResearchCard from "@/components/dashboard/ResearchCard";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import EmptyState from "@/components/dashboard/EmptyState";
import {
  SkeletonCard,
  SkeletonTableRow,
  SkeletonTimelineItem,
} from "@/components/dashboard/SkeletonCard";
import { FlaskConical, Microscope, Activity, Dna, BarChart3, Database } from "lucide-react";
import {
  QUICK_ACTIONS,
  RESEARCH_FEED,
  ACTIVITY_TIMELINE,
} from "@/data/dashboardMockData";
import {
  getDatasetStats,
  getHealthStatus,
  getAnalysisHistory,
  type DatasetStatsResponse,
  type HealthResponse,
  type AnalysisHistoryRecord,
} from "@/services/api";
import type { MetricCardData, AiStatusData, AnalysisRecord } from "@/types";

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
} as const;

const cardChip = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
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

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DatasetStatsResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      getDatasetStats(),
      getHealthStatus(),
      getAnalysisHistory(),
    ]).then(([statsResult, healthResult, historyResult]) => {
      if (cancelled) return;
      if (statsResult.status === "fulfilled") setStats(statsResult.value);
      if (healthResult.status === "fulfilled") setHealth(healthResult.value);
      if (historyResult.status === "fulfilled") setHistory(historyResult.value);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = stats ? buildMetrics(stats) : [];
  const status = buildStatus(health, stats);
  const analysisRecords = toAnalysisRecords(history);

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

          {/* Research feed */}
          <section
            aria-labelledby="research-feed-heading"
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:p-8"
          >
            <CardTopAccent color="blue" />
            <CardSectionHeader
              id="research-feed-heading"
              icon={<Microscope className="h-5 w-5" />}
              color="blue"
              title="Research Feed"
              description="Recent genetic research and clinical publications relevant to genomic analysis."
            />
            <div className="mt-2">
              {RESEARCH_FEED.map((article) => (
                <ResearchCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-8">
          {/* AI status */}
          <StatusCard status={status} />

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
            ) : (
              <ActivityTimeline items={ACTIVITY_TIMELINE} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}