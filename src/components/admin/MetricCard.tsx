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
    primary: "bg-primary/10 text-primary",
    orange: "bg-orange/10 text-orange",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  } as const;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${toneMap[tone]}`}>
          {icon}
        </span>
        {typeof delta === "number" && !loading && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              delta >= 0
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(0)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 font-display text-3xl font-extrabold text-foreground">
          {loading ? <Skeleton className="h-9 w-24" /> : (value ?? 0)}
        </div>
        {hint && !loading && (
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        )}
      </div>
    </div>
  );
}
