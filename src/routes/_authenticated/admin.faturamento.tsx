import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, DollarSign, TrendingUp, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MetricCard } from "@/components/admin/MetricCard";
import { AdminAreaChart } from "@/components/admin/AdminAreaChart";
import { Skeleton } from "@/components/ui/skeleton";
import { getBillingSummary } from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/faturamento")({
  head: () => ({ meta: [{ title: "Faturamento — Admin ${BRAND_PLACEHOLDER}" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brl2 = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Page() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-billing"],
    queryFn: () => getBillingSummary(),
  });

  return (
    <>
      <AdminPageHeader
        title="Faturamento"
        description="Receita recorrente, ARPU e distribuição por plano."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<DollarSign size={20} />}
          label="MRR"
          value={data ? brl(data.mrr) : undefined}
          hint="Receita mensal recorrente"
          tone="primary"
          loading={isLoading}
        />
        <MetricCard
          icon={<TrendingUp size={20} />}
          label="ARPU"
          value={data ? brl(data.arpu) : undefined}
          hint="Receita média por assinante"
          tone="emerald"
          loading={isLoading}
        />
        <MetricCard
          icon={<CreditCard size={20} />}
          label="Assinaturas ativas"
          value={data?.activeSubs}
          hint={data ? `${data.trialingSubs} em teste` : undefined}
          tone="violet"
          loading={isLoading}
        />
        <MetricCard
          icon={<Users size={20} />}
          label="Canceladas"
          value={data?.cancelledSubs}
          hint="Total histórico"
          tone="orange"
          loading={isLoading}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="font-display text-lg font-bold text-foreground">Receita mensal (últimos 12 meses)</h3>
            <span className="text-xs text-muted-foreground">Baseada em assinaturas iniciadas no mês</span>
          </div>
          {isLoading || !data ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <AdminAreaChart data={data.monthly} dataKey="revenue" />
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-display text-lg font-bold text-foreground">Receita por plano</h3>
          {isLoading || !data ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data.planBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma assinatura ativa ainda.</p>
          ) : (
            <ul className="space-y-3">
              {data.planBreakdown.map((p) => {
                const pct = data.mrr > 0 ? (p.revenue / data.mrr) * 100 : 0;
                return (
                  <li key={p.plan}>
                    <div className="mb-1 flex items-baseline justify-between text-sm">
                      <span className="font-semibold text-foreground">{p.plan}</span>
                      <span className="tabular-nums text-muted-foreground">{brl2(p.revenue)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-[oklch(0.6_0.2_262)]"
                        style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {p.count} {p.count === 1 ? "assinante" : "assinantes"} · {pct.toFixed(0)}% do MRR
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
