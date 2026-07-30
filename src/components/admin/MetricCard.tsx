import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

export function MetricCard({
  icon,
  label,
  value,
  hint,
  delta,
  tone = "primary",
  loading,
}: {
  icon: ReactNode;
  label: string;
  value: number | string | undefined;
  hint?: string;
  delta?: number;
  tone?: "primary" | "orange" | "emerald" | "violet";
  loading?: boolean;
}) {
  const toneMap = {
    primary: "bg-[oklch(0.955_0.032_258)] text-primary ring-1 ring-primary/15",
    orange: "bg-[oklch(0.97_0.04_60)] text-orange ring-1 ring-orange/20",
    emerald: "bg-[oklch(0.96_0.05_152)] text-emerald-600 ring-1 ring-emerald-500/20",
    violet: "bg-[oklch(0.96_0.03_300)] text-violet-600 ring-1 ring-violet-500/20",
  } as const;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[oklch(0.93_0.014_258)] bg-card p-4 shadow-[0_1px_2px_oklch(0.51_0.245_262/4%),0_12px_32px_-18px_oklch(0.51_0.245_262/16%)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_oklch(0.51_0.245_262/6%),0_20px_40px_-16px_oklch(0.51_0.245_262/22%)] sm:p-5">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl ${toneMap[tone]}`}>
          {icon}
        </span>
        {typeof delta === "number" && !loading && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              delta >= 0
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-red-50 text-red-700 ring-1 ring-red-200"
            }`}
          >
            {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(0)}%
          </span>
        )}
      </div>
      <div className="mt-3 sm:mt-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground sm:text-[11px]">
          {label}
        </div>
        <div className="mt-1.5 font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-[2rem]">
          {loading ? <Skeleton className="h-8 w-20 sm:h-9 sm:w-24" /> : (value ?? 0)}
        </div>
        {hint && !loading && (
          <div className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{hint}</div>
        )}
      </div>
    </div>
  );
}
