import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisRecord, AnalysisStatus } from "@/types";

const statusConfig: Record<AnalysisStatus, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-600" },
  processing: { label: "Processing", className: "bg-blue-50 text-blue-600" },
  queued: { label: "Queued", className: "bg-slate-100 text-slate-500" },
  failed: { label: "Failed", className: "bg-rose-50 text-rose-600" },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const columns = [
  "Patient ID",
  "Uploaded File",
  "Status",
  "Prediction",
  "Confidence",
  "Date",
  "",
];

interface AnalysisTableProps {
  records: AnalysisRecord[];
}

export default function AnalysisTable({ records }: AnalysisTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {columns.map((col) => (
              <th key={col} scope="col" className="px-4 py-3.5 font-semibold">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const status = statusConfig[record.status];
            return (
              <tr
                key={record.id}
                className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
              >
                <td className="px-4 py-4 font-medium text-slate-900">{record.patientId}</td>
                <td className="max-w-[200px] truncate px-4 py-4 text-slate-500">
                  {record.fileName}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                      status.className
                    )}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-700">{record.prediction}</td>
                <td className="px-4 py-4 text-slate-700">
                  {record.confidence > 0 ? `${record.confidence.toFixed(1)}%` : "—"}
                </td>
                <td className="px-4 py-4 text-slate-500">{formatDate(record.date)}</td>
                <td className="px-4 py-4 text-right">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={`Actions for ${record.patientId}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
