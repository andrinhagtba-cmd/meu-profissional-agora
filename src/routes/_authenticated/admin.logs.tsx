import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Filter, History, ScrollText, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { InitialsAvatar, StatusPill } from "@/components/admin/AdminTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAdminLogs, listLogActions, type AdminLogRow } from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({ meta: [{ title: "Logs de auditoria · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: LogsPage,
});

const ENTITIES = [
  { value: "", label: "Todas as entidades" },
  { value: "professional_profile", label: "Profissional" },
  { value: "quote_request", label: "Solicitação" },
  { value: "review", label: "Avaliação" },
  { value: "user", label: "Usuário" },
  { value: "report", label: "Denúncia" },
];

const ACTION_TONE: Record<string, "info" | "warning" | "success" | "danger" | "neutral"> = {
  role_granted: "success",
  role_revoked: "warning",
  account_suspended: "danger",
  account_activated: "success",
  pro_approved: "success",
  pro_rejected: "danger",
  report_resolved: "info",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function LogsPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");

  const { data: actions = [] } = useQuery({ queryKey: ["log-actions"], queryFn: listLogActions });
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-logs", search, action, entity],
    queryFn: () => listAdminLogs({ search: search || undefined, action: action || undefined, entity_type: entity || undefined }),
  });

  const grouped = useMemo(() => {
    const g: Record<string, AdminLogRow[]> = {};
    for (const l of logs) {
      const d = new Date(l.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
      (g[d] ||= []).push(l);
    }
    return g;
  }, [logs]);

  const stats = useMemo(() => {
    const uniqueAdmins = new Set(logs.map((l) => l.admin_user_id)).size;
    const uniqueActions = new Set(logs.map((l) => l.action)).size;
    return { total: logs.length, uniqueAdmins, uniqueActions };
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-5 shadow-float sm:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_30%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_45%),radial-gradient(circle_at_55%_70%,color-mix(in_oklab,var(--orange)_14%,transparent),transparent_35%)] lg:block" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles size={14} /> Auditoria
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">Logs de auditoria</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Timeline completa de todas as ações administrativas — aprovações, suspensões, mudanças de papel e mais.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric icon={<ScrollText size={18} />} label="Registros carregados" value={stats.total} />
            <Metric icon={<Activity size={18} />} label="Ações distintas" value={stats.uniqueActions} />
            <Metric icon={<History size={18} />} label="Admins ativos" value={stats.uniqueAdmins} />
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 lg:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por ação…"
              className="h-11 rounded-full border-border/80 bg-background pl-9 shadow-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={action || "all"} onValueChange={(v) => setAction(v === "all" ? "" : v)}>
              <SelectTrigger className="h-11 w-56 rounded-full border-border/80 bg-background"><Filter size={14} className="mr-2 text-muted-foreground" /><SelectValue placeholder="Ação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {actions.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={entity || "all"} onValueChange={(v) => setEntity(v === "all" ? "" : v)}>
              <SelectTrigger className="h-11 w-56 rounded-full border-border/80 bg-background"><SelectValue placeholder="Entidade" /></SelectTrigger>
              <SelectContent>
                {ENTITIES.map((e) => (<SelectItem key={e.value || "all"} value={e.value || "all"}>{e.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Nenhum log encontrado com os filtros atuais.
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([day, items]) => (
              <div key={day}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">{day}</span>
                  <span className="text-xs text-muted-foreground">{items.length} evento(s)</span>
                </div>
                <ol className="relative space-y-3 border-l-2 border-border/50 pl-6">
                  {items.map((l) => (
                    <li key={l.id} className="relative">
                      <span className="absolute -left-[29px] top-4 grid h-4 w-4 place-items-center rounded-full border-2 border-primary bg-background" />
                      <div className="rounded-2xl border border-border/60 bg-background p-4 shadow-card transition hover:border-primary/30">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill tone={ACTION_TONE[l.action] ?? "info"}>{l.action}</StatusPill>
                              {l.entity_type && <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{l.entity_type}</span>}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <InitialsAvatar name={l.admin_name} className="h-7 w-7" />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{l.admin_name || "Admin"}</p>
                                <p className="truncate text-xs text-muted-foreground">{l.admin_email || l.admin_user_id.slice(0, 8)}</p>
                              </div>
                            </div>
                            {l.metadata != null && Object.keys(l.metadata as object).length > 0 && (
                              <pre className="mt-3 max-w-full overflow-x-auto rounded-lg bg-muted/60 p-2 text-[11px] leading-4 text-muted-foreground">{JSON.stringify(l.metadata, null, 2)}</pre>
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {new Date(l.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            <span className="ml-2 opacity-70">{timeAgo(l.created_at)}</span>
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold tracking-normal text-foreground">{value}</div>
    </div>
  );
}
