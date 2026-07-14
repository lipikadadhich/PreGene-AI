import type { ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiStatusData, SystemHealthLevel } from "@/types";

const healthConfig: Record<
  SystemHealthLevel,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  operational: {
    label: "Operational",
    icon: CheckCircle2,
    className: "text-emerald-600 bg-emerald-50",
  },
  degraded: {
    label: "Degraded",
    icon: AlertTriangle,
    className: "text-amber-600 bg-amber-50",
  },
  down: {
    label: "Down",
    icon: XCircle,
    className: "text-rose-600 bg-rose-50",
  },
};

function HealthBadge({ level }: { level: SystemHealthLevel }) {
  const config = healthConfig[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        config.className
      )}
    >
      <config.icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

interface StatusCardProps {
  status: AiStatusData;
}

export default function StatusCard({ status }: StatusCardProps) {
  const rows: { label: string; value: ReactNode }[] = [
    { label: "Model Status", value: status.modelStatus },
    { label: "Dataset Version", value: status.datasetVersion },
    { label: "Last Model Update", value: status.lastModelUpdate },
    { label: "System Health", value: <HealthBadge level={status.systemHealth} /> },
    { label: "Backend Status", value: <HealthBadge level={status.backendStatus} /> },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <h3 className="text-base font-semibold text-slate-900">AI System Status</h3>
      <dl className="mt-5 flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <dt className="text-sm text-slate-500">{row.label}</dt>
            <dd className="text-sm font-medium text-slate-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
