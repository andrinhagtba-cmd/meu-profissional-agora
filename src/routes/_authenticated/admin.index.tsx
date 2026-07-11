import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  getAdminStats,
  getAdminTimeseries,
  getAdminActivity,
  getAdminTopCategories,
  getAdminFunnel,
} from "@/services/adminService";
import { MetricCard } from "@/components/admin/MetricCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminAreaChart } from "@/components/admin/AdminAreaChart";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Briefcase, ClipboardList, MessageSquare, Star, ShieldCheck,
  Flag, ArrowRight, TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard — Admin ProConecta" },
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

function AdminOverview() {
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: getAdminStats });
  const ts = useQuery({ queryKey: ["admin-ts", 30], queryFn: () => getAdminTimeseries(30) });
  const activity = useQuery({ queryKey: ["admin-activity"], queryFn: () => getAdminActivity(12) });
  const topCats = useQuery({ queryKey: ["admin-top-cats"], queryFn: () => getAdminTopCategories(6) });
  const funnel = useQuery({ queryKey: ["admin-funnel"], queryFn: getAdminFunnel });

  const signups7 = sumLast(ts.data?.signups, 7);
  const signupsPrev7 = sumLast(ts.data?.signups.slice(0, -7), 7);
  const quotes7 = sumLast(ts.data?.quotes, 7);
  const quotesPrev7 = sumLast(ts.data?.quotes.slice(0, -7), 7);
  const proposals7 = sumLast(ts.data?.proposals, 7);
  const proposalsPrev7 = sumLast(ts.data?.proposals.slice(0, -7), 7);

  const f = funnel.data;
  const maxCat = Math.max(1, ...(topCats.data ?? []).map((c) => c.quotes));

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Visão geral em tempo real do marketplace ProConecta."
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/admin/metricas">
              Ver métricas completas <ArrowRight size={14} className="ml-1" />
            </Link>
          </Button>
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

      {/* Pendências + Top categorias */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-3">
          <MetricCard
            icon={<ShieldCheck size={18} />}
            label="Profissionais pendentes"
            value={stats.data?.pendingPros}
            tone="orange"
            loading={stats.isLoading}
          />
          <MetricCard
            icon={<Star size={18} />}
            label="Avaliações pendentes"
            value={stats.data?.pendingReviews}
            tone="orange"
            loading={stats.isLoading}
          />
          <MetricCard
            icon={<Flag size={18} />}
            label="Denúncias abertas"
            value={stats.data?.openReports}
            tone="orange"
            loading={stats.isLoading}
          />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold text-foreground">Top categorias</h2>
          <p className="text-xs text-muted-foreground">Pedidos por categoria.</p>
          {topCats.isLoading ? (
            <div className="mt-4 space-y-3"><Skeleton className="h-6" /><Skeleton className="h-6" /><Skeleton className="h-6" /></div>
          ) : (
            <ul className="mt-4 space-y-3">
              {(topCats.data ?? []).map((c) => (
                <li key={c.category_id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="truncate font-medium text-foreground">{c.name}</span>
                    <span className="text-muted-foreground">{c.quotes}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(c.quotes / maxCat) * 100}%` }}
                    />
                  </div>
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
