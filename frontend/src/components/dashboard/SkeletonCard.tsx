import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
      <Shimmer className="h-11 w-11 rounded-xl" />
      <Shimmer className="mt-5 h-7 w-20" />
      <Shimmer className="mt-2 h-4 w-32" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr className="border-b border-slate-200">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <Shimmer className="h-4 w-full max-w-[110px]" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTimelineItem() {
  return (
    <div className="flex gap-3">
      <Shimmer className="h-8 w-8 shrink-0 rounded-full" />
      <div className="flex-1 py-0.5">
        <Shimmer className="h-4 w-4/5" />
        <Shimmer className="mt-2 h-3 w-1/3" />
      </div>
    </div>
  );
}

export default SkeletonCard;
