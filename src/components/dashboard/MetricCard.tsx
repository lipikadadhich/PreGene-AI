import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MetricCardData } from "@/types";

const trendIcon = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
} as const;

const trendColor = {
  up: "text-emerald-600 bg-emerald-50",
  down: "text-red-600 bg-red-50",
  flat: "text-ink-500 bg-muted",
} as const;

interface MetricCardProps {
  metric: MetricCardData;
}

export default function MetricCard({ metric }: MetricCardProps) {
  const TrendIcon = metric.trendDirection ? trendIcon[metric.trendDirection] : null;

  return (
    <div className="rounded-2xl border border-ink-900/[0.06] bg-white p-6 shadow-card transition-shadow hover:shadow-float">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            metric.accentClass
          )}
        >
          <metric.icon className="h-5 w-5" />
        </span>
        {TrendIcon && metric.trendValue && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              trendColor[metric.trendDirection!]
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {metric.trendValue}
          </span>
        )}
      </div>
      <p className="mt-5 text-3xl font-extrabold tracking-tight text-ink-900">
        {metric.value}
      </p>
      <p className="mt-1 text-sm text-ink-500">{metric.label}</p>
    </div>
  );
}
