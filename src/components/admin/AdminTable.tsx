import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[] | undefined;
  isLoading?: boolean;
  emptyText?: string;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectable?: {
    selected: Set<string>;
    onToggle: (id: string) => void;
    onToggleAll: (ids: string[]) => void;
  };
};

export function AdminTable<T>({ columns, rows, isLoading, emptyText = "Nada aqui.", rowKey, onRowClick, selectable }: Props<T>) {
  const allIds = rows?.map(rowKey) ?? [];
  const allChecked = selectable && allIds.length > 0 && allIds.every((id) => selectable.selected.has(id));

  return (
    <>
      {/* Mobile: cards empilhados */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="admin-card p-4"><Skeleton className="h-20 w-full" /></div>
          ))
        ) : !rows || rows.length === 0 ? (
          <div className="admin-card p-8 text-center text-sm text-muted-foreground">{emptyText}</div>
        ) : (
          rows.map((row) => {
            const id = rowKey(row);
            const [first, ...rest] = columns;
            return (
              <div
                key={id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "admin-card p-4 transition-transform",
                  onRowClick && "cursor-pointer active:scale-[0.99]",
                )}
              >
                <div className="flex items-start gap-3">
                  {selectable && (
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary"
                      checked={selectable.selected.has(id)}
                      onChange={() => selectable.onToggle(id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                    {first?.cell(row)}
                  </div>
                </div>
                {rest.length > 0 && (
                  <dl className="mt-3 space-y-2 border-t border-border/50 pt-3">
                    {rest.map((c) => (
                      <div key={c.key} className="flex items-start justify-between gap-3">
                        <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {c.header}
                        </dt>
                        <dd className="min-w-0 flex-1 text-right text-[13px] text-foreground">{c.cell(row)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop: tabela */}
      <div className="admin-card hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

          <thead className="border-b border-border/60 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border accent-primary"
                    checked={!!allChecked}
                    onChange={() => selectable.onToggleAll(allIds)}
                  />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} className={cn("px-4 py-3 text-left", c.className)}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-3">
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ))
            ) : !rows || rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = rowKey(row);
                return (
                  <tr
                    key={id}
                    className={cn(
                      "border-b border-border/40 transition-colors",
                      onRowClick && "cursor-pointer hover:bg-muted/40",
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border accent-primary"
                          checked={selectable.selected.has(id)}
                          onChange={() => selectable.onToggle(id)}
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: "success" | "warning" | "danger" | "info" | "neutral"; children: ReactNode }) {
  const toneMap: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-amber-200",
    danger: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-sky-50 text-sky-700 ring-sky-200",
    neutral: "bg-muted text-muted-foreground ring-border",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", toneMap[tone])}>
      {children}
    </span>
  );
}

export function InitialsAvatar({ name, className }: { name: string | null; className?: string }) {
  const label = (name ?? "?").trim().split(/\s+/).slice(0, 2).map((s) => s[0] ?? "").join("").toUpperCase() || "?";
  return (
    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-xs font-bold text-primary ring-1 ring-primary/20", className)}>
      {label}
    </div>
  );
}
