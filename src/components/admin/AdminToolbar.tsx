import { ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Filter = { value: string; label: string; count?: number };

export function AdminToolbar({
  search,
  onSearch,
  placeholder = "Buscar…",
  filters,
  activeFilter,
  onFilterChange,
  right,
  bulkBar,
}: {
  search?: string;
  onSearch?: (v: string) => void;
  placeholder?: string;
  filters?: Filter[];
  activeFilter?: string;
  onFilterChange?: (v: string) => void;
  right?: ReactNode;
  bulkBar?: ReactNode;
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {onSearch && (
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search ?? ""}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={placeholder}
              className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm shadow-sm transition-shadow focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}
        {filters && onFilterChange && (
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => onFilterChange(f.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  activeFilter === f.value
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {f.label}
                {typeof f.count === "number" && (
                  <span className={cn(
                    "rounded-full px-1.5 text-[10px]",
                    activeFilter === f.value ? "bg-white/20" : "bg-muted",
                  )}>{f.count}</span>
                )}
              </button>
            ))}
          </div>
        )}
        {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
      </div>
      {bulkBar}
    </div>
  );
}
