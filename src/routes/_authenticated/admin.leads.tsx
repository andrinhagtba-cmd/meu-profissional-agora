import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Eye,
  Filter,
  MessageCircle,
  MousePointerClick,
  Phone,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { InitialsAvatar } from "@/components/admin/AdminTable";
import { listLeadsAdmin, type AdminLeadRow } from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  head: () => ({ meta: [{ title: "Leads · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: LeadsPage,
});

const ACTION_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number }>; tone: string }> = {
  view: { label: "Visualização", icon: Eye, tone: "bg-sky-50 text-sky-700" },
  click: { label: "Clique", icon: MousePointerClick, tone: "bg-indigo-50 text-indigo-700" },
  contact: { label: "Contato", icon: Phone, tone: "bg-emerald-50 text-emerald-700" },
  message: { label: "Mensagem", icon: MessageCircle, tone: "bg-amber-50 text-amber-700" },
  proposal: { label: "Proposta", icon: TrendingUp, tone: "bg-primary/10 text-primary" },
  favorite: { label: "Favorito", icon: Star, tone: "bg-rose-50 text-rose-700" },
};

const ACTION_FILTERS = ["", "view", "click", "contact", "message", "proposal", "favorite"];
const RANGE_FILTERS = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
  { value: 365, label: "1 ano" },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "min";
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function LeadsPage() {
  const [action, setAction] = useState("");
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-leads", action, days, search],
    queryFn: () => listLeadsAdmin({ action: action || undefined, days, search: search || undefined }),
  });

  const stats = useMemo(() => {
    const total = data.length;
    const contacts = data.filter((l) => l.action_type === "contact").length;
    const messages = data.filter((l) => l.action_type === "message").length;
    const proposals = data.filter((l) => l.action_type === "proposal").length;
    const uniquePros = new Set(data.map((l) => l.professional_id)).size;
    return { total, contacts, messages, proposals, uniquePros };
  }, [data]);

  const topPros = useMemo(() => {
    const counts = new Map<string, { name: string; slug: string | null; city: string | null; state: string | null; count: number }>();
    for (const l of data) {
      const key = l.professional_id;
      const cur = counts.get(key);
      const name = l.professional?.professional_name || l.professional?.business_name || "Sem nome";
      if (cur) cur.count += 1;
      else counts.set(key, { name, slug: l.professional?.slug ?? null, city: l.professional?.city ?? null, state: l.professional?.state ?? null, count: 1 });
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [data]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-5 shadow-float sm:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_30%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_45%),radial-gradient(circle_at_55%_70%,color-mix(in_oklab,var(--orange)_14%,transparent),transparent_35%)] lg:block" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles size={14} /> Funil de captação
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">Leads e engajamento</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Fluxo real de intenções entre clientes e profissionais — de visualizações a propostas fechadas.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metric icon={<Activity size={18} />} label="Total no período" value={stats.total} />
            <Metric icon={<Phone size={18} />} label="Contatos" value={stats.contacts} />
            <Metric icon={<MessageCircle size={18} />} label="Mensagens" value={stats.messages} />
            <Metric icon={<TrendingUp size={18} />} label="Propostas" value={stats.proposals} />
            <Metric icon={<Users size={18} />} label="Profissionais únicos" value={stats.uniquePros} />
          </div>
        </div>
      </section>

      {/* TOOLBAR */}
      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {ACTION_FILTERS.map((v) => {
              const m = ACTION_META[v] ?? { label: "Todos", icon: Filter, tone: "" };
              const Icon = m.icon;
              const active = action === v;
              return (
                <button
                  key={v || "all"}
                  type="button"
                  onClick={() => setAction(v)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground shadow-card" : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"}`}
                >
                  <Icon size={14} /> {v ? m.label : "Todos"}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-border bg-background p-1">
              {RANGE_FILTERS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setDays(r.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${days === r.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >{r.label}</button>
              ))}
            </div>
            <div className="relative min-w-0 sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar profissional, cliente…"
                className="h-11 rounded-full border-border/80 bg-background pl-9 shadow-none"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),360px]">
        {/* FEED */}
        <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-6">
          <h2 className="mb-4 font-display text-lg font-extrabold tracking-normal">Feed de atividade</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
            </div>
          ) : data.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              Nenhum lead neste filtro.
            </div>
          ) : (
            <ul className="space-y-2">
              {data.slice(0, 100).map((l) => <LeadRow key={l.id} lead={l} />)}
            </ul>
          )}
        </section>

        {/* TOP PROS */}
        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-card">
                <TrendingUp size={16} />
              </div>
              <div>
                <div className="font-display text-base font-extrabold tracking-normal">Top profissionais</div>
                <p className="text-xs text-muted-foreground">Por volume de leads no período.</p>
              </div>
            </div>
            <ul className="space-y-2">
              {topPros.map((p, i) => (
                <li key={p.name + i} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-3">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">{p.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.city ?? "—"}/{p.state ?? ""}</div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{p.count}</span>
                </li>
              ))}
              {topPros.length === 0 && (
                <li className="rounded-2xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                  Sem dados no período.
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>
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

function LeadRow({ lead }: { lead: AdminLeadRow }) {
  const meta = ACTION_META[lead.action_type] ?? { label: lead.action_type, icon: Activity, tone: "bg-muted text-muted-foreground" };
  const Icon = meta.icon;
  const proName = lead.professional?.professional_name || lead.professional?.business_name || "Sem nome";
  const clientName = lead.client?.full_name || "Visitante";
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background px-3 py-2.5 transition hover:border-primary/30">
      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.tone}`}>
        <Icon size={15} />
      </span>
      <InitialsAvatar name={proName} className="h-9 w-9" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{clientName}</span>
          <span className="text-xs text-muted-foreground">→ {meta.label.toLowerCase()} em</span>
          {lead.professional?.slug ? (
            <Link
              to="/profissional/$slug"
              params={{ slug: lead.professional.slug }}
              className="truncate text-sm font-semibold text-primary hover:underline"
              target="_blank"
            >{proName}</Link>
          ) : (
            <span className="truncate text-sm font-semibold text-foreground">{proName}</span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
          {lead.quote?.title && <span className="truncate">{lead.quote.title}</span>}
          {lead.source && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">{lead.source}</span>}
        </div>
      </div>
      <span className="shrink-0 text-xs font-semibold text-muted-foreground">{timeAgo(lead.created_at)}</span>
    </li>
  );
}
