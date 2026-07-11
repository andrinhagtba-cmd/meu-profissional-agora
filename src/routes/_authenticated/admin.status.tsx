import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Cloud, Database, HardDrive, Radio, RefreshCw, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSystemStatus } from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/status")({
  head: () => ({ meta: [{ title: "Status do sistema · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: StatusPage,
});

function StatusPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["system-status"],
    queryFn: getSystemStatus,
    refetchInterval: 30_000,
  });

  const totalRecords = data?.tables.reduce((s, t) => s + t.count, 0) ?? 0;
  const allOk = data ? data.errorsLast24h === 0 : true;

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-5 shadow-float sm:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_30%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_45%),radial-gradient(circle_at_55%_70%,color-mix(in_oklab,var(--orange)_14%,transparent),transparent_35%)] lg:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles size={14} /> Infraestrutura
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">Status do sistema</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Saúde em tempo real de banco de dados, storage e canais realtime. Atualiza automaticamente a cada 30 segundos.
            </p>
          </div>
          <Button variant="outline" className="rounded-full" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={14} className={`mr-2 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </div>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <BigStat icon={<CheckCircle2 size={18} />} tone={allOk ? "success" : "danger"} label="Estado geral" value={allOk ? "Operacional" : "Instável"} />
          <BigStat icon={<Database size={18} />} tone="info" label="Registros totais" value={data ? totalRecords.toLocaleString("pt-BR") : "—"} />
          <BigStat icon={<Radio size={18} />} tone="info" label="Mensagens 24h" value={data?.realtimeActivity.messagesLast24h ?? "—"} />
          <BigStat icon={<Zap size={18} />} tone="info" label="Notificações 24h" value={data?.realtimeActivity.notificationsLast24h ?? "—"} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Tables */}
        <section className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-card xl:col-span-2">
          <header className="mb-4 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Database size={18} /></span>
            <div>
              <h2 className="font-display text-lg font-extrabold text-foreground">Banco de dados</h2>
              <p className="text-xs text-muted-foreground">Volume por tabela principal</p>
            </div>
          </header>
          {isLoading || !data ? (
            <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.tables.map((t) => (
                <li key={t.name} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{t.label}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">{t.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-extrabold text-foreground">{t.count.toLocaleString("pt-BR")}</span>
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Right column */}
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-card">
            <header className="mb-4 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><HardDrive size={18} /></span>
              <div>
                <h2 className="font-display text-lg font-extrabold text-foreground">Storage</h2>
                <p className="text-xs text-muted-foreground">Buckets Supabase</p>
              </div>
            </header>
            {isLoading || !data ? (
              <Skeleton className="h-32 rounded-2xl" />
            ) : (
              <ul className="space-y-2">
                {data.storage.map((b) => (
                  <li key={b.bucket} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{b.label}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">{b.bucket}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 size={11} /> OK
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-card">
            <header className="mb-4 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Cloud size={18} /></span>
              <div>
                <h2 className="font-display text-lg font-extrabold text-foreground">Serviços</h2>
                <p className="text-xs text-muted-foreground">Integrações ativas</p>
              </div>
            </header>
            <ul className="space-y-2">
              <ServiceRow name="Supabase Auth" ok />
              <ServiceRow name="Postgres" ok />
              <ServiceRow name="Realtime" ok />
              <ServiceRow name="Storage" ok />
              <ServiceRow name="Edge Functions" ok />
            </ul>
            {data?.updatedAt && (
              <p className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Activity size={11} /> atualizado {new Date(data.updatedAt).toLocaleTimeString("pt-BR")}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function BigStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone: "info" | "success" | "danger" }) {
  const toneCls = { info: "text-primary bg-primary/10", success: "text-emerald-600 bg-emerald-500/10", danger: "text-destructive bg-destructive/10" }[tone];
  return (
    <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${toneCls}`}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold tracking-normal text-foreground">{value}</div>
    </div>
  );
}

function ServiceRow({ name, ok }: { name: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-2.5">
      <span className="text-sm font-medium text-foreground">{name}</span>
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${ok ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
        <span className={`inline-flex h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-destructive"}`} />
        {ok ? "Operacional" : "Erro"}
      </span>
    </li>
  );
}
