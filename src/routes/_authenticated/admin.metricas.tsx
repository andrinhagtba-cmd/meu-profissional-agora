import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdminTimeseries } from "@/services/adminService";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminAreaChart } from "@/components/admin/AdminAreaChart";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/metricas")({
  head: () => ({
    meta: [
      { title: "Métricas — Admin ProConecta" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MetricasPage,
});

function MetricasPage() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const ts = useQuery({ queryKey: ["admin-ts", days], queryFn: () => getAdminTimeseries(days) });

  const total = (arr?: { count: number }[]) => (arr ?? []).reduce((a, b) => a + b.count, 0);

  return (
    <>
      <AdminPageHeader
        title="Métricas"
        description="Evolução detalhada por métrica no período selecionado."
        actions={
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
            {[7, 30, 90].map((d) => (
              <Button
                key={d}
                size="sm"
                variant={days === d ? "default" : "ghost"}
                onClick={() => setDays(d as 7 | 30 | 90)}
                className="h-8 rounded-lg px-3 text-xs"
              >
                {d}d
              </Button>
            ))}
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Novos cadastros" total={total(ts.data?.signups)} loading={ts.isLoading}>
          <AdminAreaChart data={ts.data?.signups ?? []} color="hsl(var(--primary))" />
        </ChartCard>
        <ChartCard title="Pedidos de orçamento" total={total(ts.data?.quotes)} loading={ts.isLoading}>
          <AdminAreaChart data={ts.data?.quotes ?? []} color="#10b981" />
        </ChartCard>
        <ChartCard title="Propostas enviadas" total={total(ts.data?.proposals)} loading={ts.isLoading}>
          <AdminAreaChart data={ts.data?.proposals ?? []} color="hsl(var(--orange))" />
        </ChartCard>
      </div>
    </>
  );
}

function ChartCard({
  title,
  total,
  loading,
  children,
}: {
  title: string;
  total: number;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="font-display text-3xl font-extrabold text-foreground">
          {loading ? <Skeleton className="h-9 w-20" /> : total}
        </div>
      </div>
      {loading ? <Skeleton className="h-[260px] w-full" /> : children}
    </div>
  );
}
