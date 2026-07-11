import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ClipboardList,
  Clock3,
  Filter,
  Gauge,
  Handshake,
  Layers,
  MapPin,
  MessageSquare,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/admin/AdminTable";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listSolicitacoesAdmin,
  updateSolicitacaoStatus,
  type AdminSolicitacaoRow,
} from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/solicitacoes")({
  head: () => ({ meta: [{ title: "Solicitações · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: SolicitacoesPage,
});

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  open: "Aberto",
  receiving_proposals: "Recebendo propostas",
  professional_selected: "Profissional selecionado",
  in_progress: "Em execução",
  completed: "Concluído",
  cancelled: "Cancelado",
  expired: "Expirado",
};

const STATUS_TONE: Record<string, "info" | "warning" | "success" | "danger" | "neutral"> = {
  draft: "neutral",
  open: "info",
  receiving_proposals: "warning",
  professional_selected: "info",
  in_progress: "warning",
  completed: "success",
  cancelled: "danger",
  expired: "danger",
};

const KANBAN_ORDER = [
  "open",
  "receiving_proposals",
  "professional_selected",
  "in_progress",
  "completed",
];

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "open", label: "Abertos" },
  { value: "receiving_proposals", label: "Com propostas" },
  { value: "in_progress", label: "Em execução" },
  { value: "completed", label: "Concluídos" },
  { value: "cancelled", label: "Cancelados" },
];

function fmtCurrency(v: number | null) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "há minutos";
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d}d`;
  return fmtDate(iso);
}

function SolicitacoesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<AdminSolicitacaoRow | null>(null);
  const [view, setView] = useState<"kanban" | "lista">("kanban");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-solicitacoes", filter, search],
    queryFn: () => listSolicitacoesAdmin({ status: filter || undefined, search: search || undefined }),
  });

  const stats = useMemo(() => {
    const total = data.length;
    const open = data.filter((s) => s.status === "open" || s.status === "receiving_proposals").length;
    const running = data.filter((s) => s.status === "in_progress").length;
    const done = data.filter((s) => s.status === "completed").length;
    const withProps = data.filter((s) => (s.proposals_count ?? 0) > 0).length;
    return { total, open, running, done, withProps };
  }, [data]);

  const grouped = useMemo(() => {
    const map: Record<string, AdminSolicitacaoRow[]> = Object.fromEntries(KANBAN_ORDER.map((s) => [s, []]));
    for (const row of data) if (map[row.status]) map[row.status].push(row);
    return map;
  }, [data]);

  const updateStatus = useMutation({
    mutationFn: (v: { id: string; status: string }) => updateSolicitacaoStatus(v.id, v.status),
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["admin-solicitacoes"] });
      setDetail(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-5 shadow-float sm:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_30%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_45%),radial-gradient(circle_at_55%_70%,color-mix(in_oklab,var(--orange)_14%,transparent),transparent_35%)] lg:block" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles size={14} /> Central de solicitações
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">
                Fluxo de orçamentos
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Acompanhe cada pedido do cliente do rascunho à conclusão. Priorize aqueles sem resposta e monitore o SLA.
              </p>
            </div>
            <div className="inline-flex rounded-full border border-border bg-background p-1 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setView("kanban")}
                className={`rounded-full px-4 py-1.5 transition ${view === "kanban" ? "bg-primary text-primary-foreground shadow-card" : "text-muted-foreground"}`}
              >Kanban</button>
              <button
                type="button"
                onClick={() => setView("lista")}
                className={`rounded-full px-4 py-1.5 transition ${view === "lista" ? "bg-primary text-primary-foreground shadow-card" : "text-muted-foreground"}`}
              >Lista</button>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metric icon={<ClipboardList size={18} />} label="No filtro" value={stats.total} hint="solicitações" />
            <Metric icon={<Clock3 size={18} />} label="Aguardando" value={stats.open} hint="ação necessária" />
            <Metric icon={<Handshake size={18} />} label="Com propostas" value={stats.withProps} hint="engajadas" />
            <Metric icon={<Gauge size={18} />} label="Em execução" value={stats.running} hint="em andamento" />
            <Metric icon={<Layers size={18} />} label="Concluídas" value={stats.done} hint="finalizadas" />
          </div>
        </div>
      </section>

      {/* TOOLBAR */}
      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground shadow-card" : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"}`}
                >
                  <Filter size={14} /> {f.label}
                </button>
              );
            })}
          </div>
          <div className="relative min-w-0 xl:w-[360px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título do pedido…"
              className="h-11 rounded-full border-border/80 bg-background pl-9 shadow-none"
            />
          </div>
        </div>
      </section>

      {/* CONTENT */}
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3 2xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-[1.5rem]" />)}
        </div>
      ) : view === "kanban" ? (
        <div className="grid gap-4 overflow-x-auto lg:grid-cols-3 2xl:grid-cols-5">
          {KANBAN_ORDER.map((status) => (
            <div key={status} className="rounded-[1.75rem] border border-border/70 bg-card/60 p-3 shadow-card">
              <div className="mb-3 flex items-center justify-between px-2">
                <div className="font-display text-sm font-extrabold uppercase tracking-wide text-foreground/80">
                  {STATUS_LABEL[status]}
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {grouped[status]?.length ?? 0}
                </span>
              </div>
              <div className="space-y-3">
                {(grouped[status] ?? []).slice(0, 12).map((row) => (
                  <KanbanCard key={row.id} row={row} onOpen={() => setDetail(row)} />
                ))}
                {(grouped[status]?.length ?? 0) === 0 && (
                  <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
                    Vazio por aqui.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {data.map((row) => <ListCard key={row.id} row={row} onOpen={() => setDetail(row)} />)}
          {data.length === 0 && (
            <div className="col-span-full rounded-[2rem] border border-dashed bg-card p-12 text-center shadow-card">
              <ClipboardList className="mx-auto text-muted-foreground" size={36} />
              <p className="mt-3 text-sm text-muted-foreground">Nenhuma solicitação neste filtro.</p>
            </div>
          )}
        </div>
      )}

      <DetailSheet
        row={detail}
        onClose={() => setDetail(null)}
        onStatus={(status) => detail && updateStatus.mutate({ id: detail.id, status })}
        saving={updateStatus.isPending}
      />
    </div>
  );
}

function Metric({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold tracking-normal text-foreground">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function KanbanCard({ row, onOpen }: { row: AdminSolicitacaoRow; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full rounded-2xl border border-border/70 bg-card p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-float"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 font-display text-sm font-extrabold tracking-normal text-foreground">{row.title}</h3>
        <StatusPill tone={STATUS_TONE[row.status] ?? "neutral"}>{STATUS_LABEL[row.status] ?? row.status}</StatusPill>
      </div>
      {row.category?.name && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary">
          {row.category.name}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><MapPin size={11} />{row.city ?? "—"}/{row.state ?? ""}</span>
        <span className="inline-flex items-center gap-1"><Users size={11} />{row.proposals_count ?? 0} propostas</span>
        <span className="inline-flex items-center gap-1"><Clock3 size={11} />{timeAgo(row.created_at)}</span>
      </div>
    </button>
  );
}

function ListCard({ row, onOpen }: { row: AdminSolicitacaoRow; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-4 rounded-2xl border border-border/70 bg-card p-4 text-left shadow-card transition hover:border-primary/30 hover:shadow-float"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
        <ClipboardList size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 font-display text-base font-extrabold text-foreground">{row.title}</h3>
          <StatusPill tone={STATUS_TONE[row.status] ?? "neutral"}>{STATUS_LABEL[row.status] ?? row.status}</StatusPill>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{row.description || "Sem descrição"}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{row.client?.full_name ?? "Cliente anônimo"}</span>
          <span className="inline-flex items-center gap-1"><MapPin size={11} />{row.city ?? "—"}/{row.state ?? ""}</span>
          <span className="inline-flex items-center gap-1"><Users size={11} />{row.proposals_count ?? 0} propostas</span>
          <span>{fmtCurrency(row.budget_max ?? row.budget_min)}</span>
          <span>{timeAgo(row.created_at)}</span>
        </div>
      </div>
    </button>
  );
}

function DetailSheet({ row, onClose, onStatus, saving }: { row: AdminSolicitacaoRow | null; onClose: () => void; onStatus: (s: string) => void; saving: boolean }) {
  return (
    <Sheet open={!!row} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        {row && (
          <>
            <SheetHeader>
              <SheetTitle className="font-display text-xl">{row.title}</SheetTitle>
              <SheetDescription>
                Criado em {new Date(row.created_at).toLocaleString("pt-BR")} · {row.city}/{row.state}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-2">
                <StatusPill tone={STATUS_TONE[row.status] ?? "neutral"}>{STATUS_LABEL[row.status] ?? row.status}</StatusPill>
                {row.urgency && <StatusPill tone="warning">Urgência: {row.urgency}</StatusPill>}
                <StatusPill tone="info">{row.proposals_count ?? 0} propostas</StatusPill>
              </div>

              <div className="rounded-2xl border bg-background p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição</div>
                <p className="mt-2 whitespace-pre-line text-sm text-foreground">{row.description || "—"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Info label="Categoria" value={row.category?.name ?? "—"} />
                <Info label="Orçamento" value={`${fmtCurrency(row.budget_min)} — ${fmtCurrency(row.budget_max)}`} />
                <Info label="Cliente" value={row.client?.full_name ?? "—"} />
                <Info label="Email" value={row.client?.email ?? "—"} />
                <Info label="Telefone" value={row.client?.phone ?? "—"} />
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Atualizar status
                </div>
                <Select value={row.status} onValueChange={onStatus} disabled={saving}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABEL).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-full" onClick={onClose}>
                  <X size={14} className="mr-1" /> Fechar
                </Button>
                <Button className="flex-1 rounded-full" onClick={onClose}>
                  <MessageSquare size={14} className="mr-1" /> Ver propostas
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
