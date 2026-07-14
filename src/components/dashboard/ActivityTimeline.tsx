import { Upload, FlaskConical, Download, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityItem, ActivityType } from "@/types";

const activityConfig: Record<
  ActivityType,
  { icon: typeof Upload; className: string }
> = {
  upload: { icon: Upload, className: "bg-blue-50 text-blue-600" },
  analysis_started: { icon: FlaskConical, className: "bg-blue-50 text-blue-600" },
  report_downloaded: { icon: Download, className: "bg-amber-50 text-amber-600" },
  prediction_completed: {
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-600",
  },
};

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface ActivityTimelineProps {
  items: ActivityItem[];
}

export default function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <ol className="flex flex-col gap-5">
      {items.map((item, index) => {
        const config = activityConfig[item.type];
        const isLast = index === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-3">
            {!isLast && (
              <span className="absolute left-4 top-9 h-[calc(100%-2px)] w-px bg-slate-200" />
            )}
            <span
              className={cn(
                "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                config.className
              )}
            >
              <config.icon className="h-4 w-4" />
            </span>
            <div className="pb-0.5 pt-0.5">
              <p className="text-sm font-medium text-slate-900">{item.description}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {formatTimestamp(item.timestamp)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}