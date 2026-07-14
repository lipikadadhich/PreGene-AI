import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Download,
  Loader2,
  AlertCircle,
  Search,
  Trash2,
  Eye,
  X,
  ArrowUpDown,
  Columns3,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getReportList,
  getReportDetail,
  downloadReportById,
  deleteReport,
  type ReportListItem,
  type ReportDetail,
} from "@/services/api";

type RiskFilter = "all" | "low" | "medium" | "high";
type SortOption = "date_desc" | "date_asc" | "risk_desc" | "risk_asc";

function riskBadgeClasses(level: string | undefined) {
  const normalized = (level || "").toLowerCase();
  if (normalized.includes("high")) return "bg-red-50 text-red-700 border-red-200";
  if (normalized.includes("medium") || normalized.includes("moderate"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (normalized.includes("low")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-ink-900/[0.04] text-ink-600 border-ink-900/10";
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Detail modal — used for both single "View" and 2-report "Compare"
// ---------------------------------------------------------------------------
function ReportDetailModal({
  reports,
  onClose,
}: {
  reports: ReportDetail[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4">
      <div className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-ink-900/[0.06] bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-ink-900">
            {reports.length > 1 ? "Compare Reports" : "Report Detail"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-900/[0.04] hover:text-ink-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className={`grid gap-6 p-6 ${
            reports.length > 1 ? "sm:grid-cols-2" : "sm:grid-cols-1"
          }`}
        >
          {reports.map((report) => (
            <div key={report.report_id} className="space-y-4">
              <div className="rounded-xl border border-ink-900/10 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  Report ID
                </p>
                <p className="mt-1 font-mono text-sm text-ink-900">{report.report_id}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-400">
                  Generated
                </p>
                <p className="mt-1 text-sm text-ink-700">{formatDate(report.timestamp)}</p>
              </div>

              <div className="rounded-xl border border-ink-900/10 p-4">
                <p className="text-sm font-semibold text-ink-900">{report.disease}</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-ink-400">Risk Score</p>
                    <p className="text-lg font-bold text-ink-900">{report.risk_score}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Risk Level</p>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${riskBadgeClasses(
                        report.risk_level
                      )}`}
                    >
                      {report.risk_level}
                    </span>
                  </div>
                </div>
              </div>

              {report.recommendation && (
                <div className="rounded-xl border border-ink-900/10 p-4">
                  <p className="mb-2 text-sm font-semibold text-ink-900">
                    CRISPR Recommendation
                  </p>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-400">Gene</dt>
                      <dd className="font-mono text-ink-800">{report.recommendation.gene}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-400">Mutation</dt>
                      <dd className="font-mono text-ink-800">{report.recommendation.mutation}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-400">Editing Method</dt>
                      <dd className="text-ink-800">{report.recommendation.editing_method}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-400">Success Rate</dt>
                      <dd className="text-ink-800">{report.recommendation.success_rate}%</dd>
                    </div>
                  </dl>
                </div>
              )}

              {report.inheritance && (
                <div className="rounded-xl border border-ink-900/10 p-4">
                  <p className="mb-2 text-sm font-semibold text-ink-900">
                    Inheritance Probability
                  </p>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-ink-400">Healthy</dt>
                      <dd className="text-ink-800">{report.inheritance.Healthy}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-400">Carrier</dt>
                      <dd className="text-ink-800">{report.inheritance.Carrier}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-400">Affected</dt>
                      <dd className="text-ink-800">{report.inheritance.Affected}%</dd>
                    </div>
                  </dl>
                </div>
              )}

              {report.counselling?.length > 0 && (
                <div className="rounded-xl border border-ink-900/10 p-4">
                  <p className="mb-2 text-sm font-semibold text-ink-900">
                    Genetic Counselling Notes
                  </p>
                  <ul className="space-y-1.5 text-sm text-ink-700">
                    {report.counselling.map((note, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const navigate = useNavigate();

  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("date_desc");

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [modalReports, setModalReports] = useState<ReportDetail[] | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  function loadReports() {
    setIsLoading(true);
    setLoadError(null);
    getReportList()
      .then((res) => setReports(res.reports))
      .catch(() => setLoadError("Could not load report history. Please try again."))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((r) => r.disease.toLowerCase().includes(q));
    }

    if (riskFilter !== "all") {
      result = result.filter((r) => (r.risk_level || "").toLowerCase().includes(riskFilter));
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case "date_asc":
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case "date_desc":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case "risk_asc":
          return (a.risk_score ?? 0) - (b.risk_score ?? 0);
        case "risk_desc":
          return (b.risk_score ?? 0) - (a.risk_score ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [reports, searchQuery, riskFilter, sortOption]);

  async function handleDownload(reportId: string) {
    setDownloadingId(reportId);
    setActionError(null);
    try {
      const blob = await downloadReportById(reportId);
      triggerBlobDownload(blob, `${reportId}.pdf`);
    } catch {
      setActionError("Could not download this report. Its PDF file may be missing.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(reportId: string) {
    setDeletingId(reportId);
    setActionError(null);
    try {
      await deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r.report_id !== reportId));
      setSelectedForCompare((prev) => prev.filter((id) => id !== reportId));
    } catch {
      setActionError("Could not delete this report. Please try again.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function handleView(reportId: string) {
    setIsModalLoading(true);
    setActionError(null);
    try {
      const detail = await getReportDetail(reportId);
      setModalReports([detail]);
    } catch {
      setActionError("Could not load this report's details.");
    } finally {
      setIsModalLoading(false);
    }
  }

  async function handleCompare() {
    if (selectedForCompare.length !== 2) return;
    setIsModalLoading(true);
    setActionError(null);
    try {
      const details = await Promise.all(
        selectedForCompare.map((id) => getReportDetail(id))
      );
      setModalReports(details);
    } catch {
      setActionError("Could not load one or both reports for comparison.");
    } finally {
      setIsModalLoading(false);
    }
  }

  function toggleCompareSelection(reportId: string) {
    setSelectedForCompare((prev) => {
      if (prev.includes(reportId)) {
        return prev.filter((id) => id !== reportId);
      }
      if (prev.length >= 2) {
        // Replace the oldest selection so the user can always pick a new
        // second item without having to manually deselect first.
        return [prev[1], reportId];
      }
      return [...prev, reportId];
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Search, filter, and manage your clinical genetic analysis reports."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Reports" }]}
      />

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-ink-900/15 bg-white">
          <p className="flex items-center gap-2 text-sm text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading report history...
          </p>
        </div>
      ) : loadError ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>{loadError}</span>
            </div>
            <Button size="sm" onClick={loadReports}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Completed analyses will generate clinical reports that appear here."
          actionLabel="Start Analysis"
          onAction={() => navigate("/analysis")}
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Report History</CardTitle>
                <CardDescription>
                  {reports.length} report{reports.length !== 1 ? "s" : ""} generated so far.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by disease..."
                  className="w-full rounded-xl border border-ink-900/15 py-2.5 pl-10 pr-4 text-sm"
                />
              </div>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
                className="rounded-xl border border-ink-900/15 px-3.5 py-2.5 text-sm"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>

              <div className="relative">
                <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="rounded-xl border border-ink-900/15 py-2.5 pl-9 pr-4 text-sm"
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="risk_desc">Highest Risk First</option>
                  <option value="risk_asc">Lowest Risk First</option>
                </select>
              </div>
            </div>

            {selectedForCompare.length > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-medium text-brand-700">
                  <Columns3 className="h-4 w-4" />
                  {selectedForCompare.length} of 2 selected for comparison
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedForCompare([])}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    disabled={selectedForCompare.length !== 2 || isModalLoading}
                    onClick={handleCompare}
                  >
                    {isModalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Compare"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {actionError && (
              <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <span>{actionError}</span>
              </div>
            )}

            {/* List */}
            {filteredReports.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-400">
                No reports match your search or filter.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-ink-900/10">
                <table className="w-full text-sm">
                  <thead className="bg-ink-900/[0.02] text-left text-xs font-medium uppercase tracking-wide text-ink-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Compare</th>
                      <th className="px-4 py-3 font-medium">Disease</th>
                      <th className="px-4 py-3 font-medium">Risk</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-900/[0.06]">
                    {filteredReports.map((report) => (
                      <tr key={report.report_id} className="hover:bg-ink-900/[0.015]">
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={selectedForCompare.includes(report.report_id)}
                            onChange={() => toggleCompareSelection(report.report_id)}
                            aria-label={`Select ${report.disease} for comparison`}
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-ink-900">{report.disease}</p>
                          <p className="font-mono text-xs text-ink-400">{report.report_id}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${riskBadgeClasses(
                              report.risk_level
                            )}`}
                          >
                            {report.risk_score}% · {report.risk_level}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-ink-600">
                          {formatDate(report.timestamp)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleView(report.report_id)}
                              className="rounded-lg p-2 text-ink-500 hover:bg-ink-900/[0.05] hover:text-ink-900"
                              aria-label="View report"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownload(report.report_id)}
                              disabled={downloadingId === report.report_id}
                              className="rounded-lg p-2 text-ink-500 hover:bg-ink-900/[0.05] hover:text-ink-900 disabled:opacity-50"
                              aria-label="Download report"
                              title="Download"
                            >
                              {downloadingId === report.report_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(report.report_id)}
                              className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600"
                              aria-label="Delete report"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View / Compare modal */}
      {modalReports && (
        <ReportDetailModal
          reports={modalReports}
          onClose={() => setModalReports(null)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-ink-900">Delete this report?</h3>
            <p className="mt-1.5 text-sm text-ink-500">
              This will permanently delete the report and its PDF file. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deletingId === confirmDeleteId}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="bg-red-600 hover:bg-red-700"
              >
                {deletingId === confirmDeleteId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}