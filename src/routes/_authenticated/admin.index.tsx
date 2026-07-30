import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  getAdminStats,
  getAdminTimeseries,
  getAdminActivity,
  getAdminTopCategories,
  getAdminFunnel,
} from "@/services/adminService";
import {
  getLatestProfessionals,
  getSubscriptionSummary,
  getAdminPendings,
  getTopViewedPros,
  getLatestQuotes,
} from "@/services/adminDashboardService";
import { MetricCard } from "@/components/admin/MetricCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminAreaChart } from "@/components/admin/AdminAreaChart";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { ProAvatar } from "@/components/shared/ProAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DERIVED_CLASS, DERIVED_LABEL, daysLabel, whatsappTemplate } from "@/lib/subscriptionStatus";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatProfileViews } from "@/lib/formatViews";
import {
  Users, Briefcase, ClipboardList, MessageSquare, Star, ShieldCheck,
  Flag, ArrowRight, TrendingUp, Wallet, CalendarClock, AlertTriangle,
  Image as ImageIcon, Mail, Eye, UserPlus, BadgeCheck, Inbox, CircleDollarSign,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOverview,
});

function sumLast(arr: { count: number }[] | undefined, days: number) {
  if (!arr) return 0;
  return arr.slice(-days).reduce((a, b) => a + b.count, 0);
}
function delta(cur: number, prev: number) {
  if (prev === 0) return cur === 0 ? 0 : 100;
  return ((cur - prev) / prev) * 100;
}
const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const dt = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—";

function AdminOverview() {
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: getAdminStats });
  const ts = useQuery({ queryKey: ["admin-ts", 30], queryFn: () => getAdminTimeseries(30) });
  const activity = useQuery({ queryKey: ["admin-activity"], queryFn: () => getAdminActivity(12) });
  const topCats = useQuery({ queryKey: ["admin-top-cats"], queryFn: () => getAdminTopCategories(6) });
  const funnel = useQuery({ queryKey: ["admin-funnel"], queryFn: getAdminFunnel });
  const latestPros = useQuery({ queryKey: ["admin-latest-pros"], queryFn: () => getLatestProfessionals(6) });
  const subs = useQuery({ queryKey: ["admin-subs-summary"], queryFn: getSubscriptionSummary });
  const pend = useQuery({ queryKey: ["admin-pendings"], queryFn: getAdminPendings });
  const topViews = useQuery({ queryKey: ["admin-top-views"], queryFn: () => getTopViewedPros(5) });
  const latestQuotes = useQuery({ queryKey: ["admin-latest-quotes"], queryFn: () => getLatestQuotes(6) });

  const signups7 = sumLast(ts.data?.signups, 7);
  const signupsPrev7 = sumLast(ts.data?.signups.slice(0, -7), 7);
  const quotes7 = sumLast(ts.data?.quotes, 7);
  const quotesPrev7 = sumLast(ts.data?.quotes.slice(0, -7), 7);
  const proposals7 = sumLast(ts.data?.proposals, 7);
  const proposalsPrev7 = sumLast(ts.data?.proposals.slice(0, -7), 7);

  const f = funnel.data;
  const maxCat = Math.max(1, ...(topCats.data ?? []).map((c) => c.pros));
  const s = subs.data;

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Visão geral em tempo real do marketplace."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/admin/assinaturas">
                Assinaturas <ArrowRight size={14} className="ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/admin/metricas">
                Ver métricas completas <ArrowRight size={14} className="ml-1" />
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPIs principais */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Users size={20} />}
          label="Usuários"
          value={stats.data?.users}
          hint={`+${signups7} últimos 7 dias`}
          delta={delta(signups7, signupsPrev7)}
          loading={stats.isLoading}
        />
        <MetricCard
          icon={<Briefcase size={20} />}
          label="Profissionais"
          value={stats.data?.pros}
          hint={pend.data ? `${pend.data.publishedPros} publicados · ${pend.data.draftPros} ocultos` : undefined}
          tone="violet"
          loading={stats.isLoading}
        />
        <MetricCard
          icon={<ClipboardList size={20} />}
          label="Pedidos"
          value={stats.data?.quotes}
          hint={`+${quotes7} últimos 7 dias`}
          delta={delta(quotes7, quotesPrev7)}
          tone="emerald"
          loading={stats.isLoading}
        />
        <MetricCard
          icon={<MessageSquare size={20} />}
          label="Propostas"
          value={stats.data?.proposals}
          hint={`+${proposals7} últimos 7 dias`}
          delta={delta(proposals7, proposalsPrev7)}
          tone="orange"
          loading={stats.isLoading}
        />
      </div>

      {/* KPIs financeiros / assinaturas */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Wallet size={20} />}
          label="Receita mensal (MRR)"
          value={s ? brl(s.mrr) : undefined}
          hint={s ? `ARR estimado ${brl(s.arr)}` : undefined}
          tone="emerald"
          loading={subs.isLoading}
        />
        <MetricCard
          icon={<BadgeCheck size={20} />}
          label="Assinaturas ativas"
          value={s?.active}
          hint={s ? `${s.pending} aguardando ativação` : undefined}
          loading={subs.isLoading}
        />
        <MetricCard
          icon={<CalendarClock size={20} />}
          label="Vencendo em 30 dias"
          value={s?.expiring30}
          hint={s ? `${s.expiring7} em até 7 dias` : undefined}
          tone="orange"
          loading={subs.isLoading}
        />
        <MetricCard
          icon={<AlertTriangle size={20} />}
          label="Assinaturas vencidas"
          value={s?.expired}
          hint="Cobrança via WhatsApp"
          tone="orange"
          loading={subs.isLoading}
        />
      </div>

      {/* Vencimentos + últimos profissionais */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Vencimentos e assinaturas expirando</h2>
              <p className="text-xs text-muted-foreground">Ordenado por urgência de cobrança.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-xl">
              <Link to="/admin/assinaturas">Gerenciar <ArrowRight size={14} className="ml-1" /></Link>
            </Button>
          </div>
          {subs.isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : !s?.items.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma assinatura vencendo nos próximos 30 dias. 🎉</p>
          ) : (
            <ul className="divide-y divide-border">
              {s.items.map((item) => {
                const url = buildWhatsAppUrl(
                  item.whatsapp ?? "",
                  whatsappTemplate({ contactName: item.name, companyName: item.name, expiresAt: item.expires_at }),
                );
                return (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.plan_name ?? "Sem plano"} · vence {dt(item.expires_at)} · {daysLabel(item.expires_at)}
                        {item.amount ? ` · ${brl(Number(item.amount))}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${DERIVED_CLASS[item.derived]}`}>
                        {DERIVED_LABEL[item.derived]}
                      </span>
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-95"
                        >
                          <MessageSquare size={13} /> Cobrar
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">Últimos cadastros</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-xl">
              <Link to="/admin/profissionais">Todos</Link>
            </Button>
          </div>
          {latestPros.isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <ul className="space-y-3">
              {(latestPros.data ?? []).map((p) => (
                <li key={p.id}>
                  <Link
                    to="/admin/profissionais/$id"
                    params={{ id: p.id }}
                    className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-secondary"
                  >
                    <ProAvatar
                      size="sm"
                      initials={p.name.slice(0, 2).toUpperCase()}
                      color="bg-primary/10 text-primary"
                      imageUrl={p.avatar_url ?? undefined}
                      alt={p.name}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.location_label || p.city || "DF"} · {dt(p.created_at)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                        p.profile_status === "published"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}
                    >
                      {p.profile_status === "published" ? "Publicado" : "Rascunho"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Charts + funil */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" />
                <h2 className="font-display text-lg font-bold text-foreground">
                  Atividade dos últimos 30 dias
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Novos cadastros por dia (todos os perfis).
              </p>
            </div>
          </div>
          {ts.isLoading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <AdminAreaChart data={ts.data?.signups ?? []} color="hsl(var(--primary))" />
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold text-foreground">Funil de conversão</h2>
          <p className="text-xs text-muted-foreground">Do pedido à avaliação.</p>
          {funnel.isLoading || !f ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <FunnelBar label="Pedidos" value={f.quotes} max={f.quotes} tone="bg-primary" />
              <FunnelBar label="Com proposta" value={f.withProposal} max={f.quotes} tone="bg-violet-500" />
              <FunnelBar label="Aceitos" value={f.accepted} max={f.quotes} tone="bg-emerald-500" />
              <FunnelBar label="Avaliados" value={f.reviewed} max={f.quotes} tone="bg-orange" />
            </div>
          )}
        </div>
      </div>

      {/* Central de pendências */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold text-foreground">Central de pendências</h2>
        <p className="text-xs text-muted-foreground">Tudo que precisa da sua ação agora.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <PendingTile to="/admin/verificacoes" icon={<ShieldCheck size={16} />} label="Profissionais pendentes" value={stats.data?.pendingPros} />
          <PendingTile to="/admin/avaliacoes" icon={<Star size={16} />} label="Avaliações pendentes" value={stats.data?.pendingReviews} />
          <PendingTile to="/admin/denuncias" icon={<Flag size={16} />} label="Denúncias abertas" value={stats.data?.openReports} />
          <PendingTile to="/admin/midias" icon={<ImageIcon size={16} />} label="Fotos aguardando" value={pend.data?.photoRequests} />
          <PendingTile to="/admin/contatos" icon={<Mail size={16} />} label="Mensagens de contato" value={pend.data?.contactMessages} />
          <PendingTile to="/admin/solicitacoes" icon={<Inbox size={16} />} label="Pedidos em aberto" value={pend.data?.openQuotes} />
          <PendingTile to="/admin/leads" icon={<CircleDollarSign size={16} />} label="Leads (30 dias)" value={pend.data?.leads30} />
          <PendingTile to="/admin/midias" icon={<ImageIcon size={16} />} label="Portfólio a moderar" value={pend.data?.portfolioPending} />
        </div>
      </div>

      {/* Top categorias + mais vistos + últimos pedidos */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold text-foreground">Top categorias</h2>
          <p className="text-xs text-muted-foreground">Pedidos por categoria.</p>
          {topCats.isLoading ? (
            <div className="mt-4 space-y-3"><Skeleton className="h-6" /><Skeleton className="h-6" /><Skeleton className="h-6" /></div>
          ) : (
            <ul className="mt-4 space-y-3">
              {(topCats.data ?? []).map((c) => (
                <li key={c.category_id}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-foreground">{c.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {c.pros} prof. · {c.quotes} ped.
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(c.pros / maxCat) * 100}%` }}
                    />
                  </div>
                </li>
              ))}

            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Perfis mais vistos</h2>
          </div>
          <p className="text-xs text-muted-foreground">Visualizações acumuladas.</p>
          {topViews.isLoading ? (
            <div className="mt-4 space-y-3"><Skeleton className="h-6" /><Skeleton className="h-6" /><Skeleton className="h-6" /></div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {(topViews.data ?? []).map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-secondary text-[11px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">{p.name}</span>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">{formatProfileViews(p.views, { compact: true })}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Últimos pedidos</h2>
            <Button asChild variant="ghost" size="sm" className="rounded-xl">
              <Link to="/admin/solicitacoes">Ver</Link>
            </Button>
          </div>
          {latestQuotes.isLoading ? (
            <div className="mt-4 space-y-3"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {(latestQuotes.data ?? []).map((q) => (
                <li key={q.id} className="py-2.5">
                  <p className="truncate text-sm font-medium text-foreground">{q.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {q.category_name ?? "Sem categoria"} · {q.city ?? "DF"} · {dt(q.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Feed de atividade */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Atividade recente</h2>
            <p className="text-xs text-muted-foreground">Últimos eventos da plataforma.</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="rounded-xl">
            <Link to="/admin/atividade">Ver tudo <ArrowRight size={14} className="ml-1" /></Link>
          </Button>
        </div>
        {activity.isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : (
          <ActivityFeed items={activity.data ?? []} />
        )}
      </div>
    </>
  );
}

function PendingTile({
  to, icon, label, value,
}: { to: string; icon: React.ReactNode; label: string; value: number | undefined }) {
  const active = (value ?? 0) > 0;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
        active ? "border-orange/30 bg-orange/5" : "border-border bg-secondary/40"
      }`}
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${active ? "bg-orange/15 text-orange" : "bg-card text-muted-foreground"}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="font-display text-xl font-extrabold leading-none text-foreground">{value ?? 0}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </Link>
  );
}

function FunnelBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {value} <span className="opacity-60">({pct.toFixed(0)}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
