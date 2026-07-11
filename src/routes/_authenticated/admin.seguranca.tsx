import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  Fingerprint,
  Flag,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { InitialsAvatar, StatusPill } from "@/components/admin/AdminTable";
import { getSecurityOverview, type AdminLogRow } from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/seguranca")({
  head: () => ({ meta: [{ title: "Segurança · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: SegurancaPage,
});

function SegurancaPage() {
  const { data, isLoading } = useQuery({ queryKey: ["security-overview"], queryFn: getSecurityOverview });

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-5 shadow-float sm:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_30%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_45%),radial-gradient(circle_at_55%_70%,color-mix(in_oklab,var(--orange)_14%,transparent),transparent_35%)] lg:block" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles size={14} /> Segurança
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">Centro de segurança</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Radar consolidado da saúde de contas, atribuições de papéis, denúncias e verificações pendentes.
          </p>
          {isLoading || !data ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={<Users size={18} />} label="Contas totais" value={data.totalUsers} tone="info" />
              <Metric icon={<CheckCircle2 size={18} />} label="Contas ativas" value={data.activeUsers} tone="success" />
              <Metric icon={<Lock size={18} />} label="Suspensas" value={data.suspendedUsers} tone={data.suspendedUsers > 0 ? "danger" : "neutral"} />
              <Metric icon={<AlertTriangle size={18} />} label="Denúncias abertas" value={data.pendingReports} tone={data.pendingReports > 0 ? "warning" : "neutral"} />
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Role distribution */}
        <section className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-card xl:col-span-1">
          <header className="mb-4 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Crown size={18} /></span>
            <div>
              <h2 className="font-display text-lg font-extrabold text-foreground">Distribuição de papéis</h2>
              <p className="text-xs text-muted-foreground">Cobertura atual do painel</p>
            </div>
          </header>
          {isLoading || !data ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          ) : (
            <ul className="space-y-3">
              <RoleBar label="Administradores" count={data.adminCount} total={data.totalUsers} tone="danger" />
              <RoleBar label="Profissionais" count={data.proCount} total={data.totalUsers} tone="info" />
              <RoleBar label="Clientes" count={data.clientCount} total={data.totalUsers} tone="success" />
            </ul>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild className="rounded-full"><Link to="/admin/permissoes"><UserCog size={14} className="mr-2" />Gerenciar papéis</Link></Button>
            <Button asChild variant="outline" className="rounded-full"><Link to="/admin/denuncias"><Flag size={14} className="mr-2" />Ver denúncias</Link></Button>
          </div>
        </section>

        {/* Health checks */}
        <section className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-card xl:col-span-2">
          <header className="mb-4 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldCheck size={18} /></span>
            <div>
              <h2 className="font-display text-lg font-extrabold text-foreground">Checklist de segurança</h2>
              <p className="text-xs text-muted-foreground">Sinalizadores operacionais em tempo real</p>
            </div>
          </header>
          {isLoading || !data ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              <Health ok={data.adminCount >= 2} title="Redundância de administradores" hint={data.adminCount >= 2 ? `${data.adminCount} admins ativos` : "Adicione ao menos 2 admins para redundância"} />
              <Health ok={data.pendingProVerification === 0} title="Verificações pendentes" hint={data.pendingProVerification === 0 ? "Nenhuma verificação em aberto" : `${data.pendingProVerification} profissionais aguardando`} link="/admin/verificacoes" />
              <Health ok={data.pendingReports === 0} title="Denúncias em aberto" hint={data.pendingReports === 0 ? "Fila vazia" : `${data.pendingReports} denúncias exigem revisão`} link="/admin/denuncias" />
              <Health ok={data.suspendedUsers < 10} title="Volume de suspensões" hint={data.suspendedUsers < 10 ? "Dentro do baseline" : `${data.suspendedUsers} contas suspensas – revisar`} link="/admin/usuarios" />
              <Health ok title="RLS ativo" hint="Row-Level Security ativa nas tabelas críticas" />
              <Health ok title="Auth Supabase" hint="JWT + refresh tokens em vigor" />
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Suspended users */}
        <section className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-card">
          <header className="mb-4 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-destructive/10 text-destructive"><ShieldAlert size={18} /></span>
            <div>
              <h2 className="font-display text-lg font-extrabold text-foreground">Contas suspensas</h2>
              <p className="text-xs text-muted-foreground">Últimas suspensões aplicadas</p>
            </div>
          </header>
          {isLoading || !data ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : data.suspendedList.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhuma conta suspensa 🎉</div>
          ) : (
            <ul className="space-y-2">
              {data.suspendedList.map((u) => (
                <li key={u.user_id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-3">
                  <InitialsAvatar name={u.full_name} className="h-9 w-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{u.full_name || "Sem nome"}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <StatusPill tone="danger">suspensa</StatusPill>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent role changes */}
        <section className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-card">
          <header className="mb-4 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Fingerprint size={18} /></span>
            <div>
              <h2 className="font-display text-lg font-extrabold text-foreground">Ações sensíveis recentes</h2>
              <p className="text-xs text-muted-foreground">Papéis, suspensões e reativações</p>
            </div>
          </header>
          {isLoading || !data ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : data.recentRoleChanges.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhuma ação sensível registrada.</div>
          ) : (
            <ul className="space-y-2">
              {data.recentRoleChanges.map((l: AdminLogRow) => (
                <li key={l.id} className="rounded-2xl border border-border/60 bg-background p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <StatusPill tone="warning">{l.action}</StatusPill>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{l.entity_type ?? "—"} · {l.entity_id?.slice(0, 8) ?? ""}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Button asChild variant="outline" className="w-full rounded-full"><Link to="/admin/logs">Ver todos os logs</Link></Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number | string; tone: "info" | "warning" | "success" | "danger" | "neutral" }) {
  const toneCls = { info: "text-primary bg-primary/10", warning: "text-orange bg-orange/10", success: "text-emerald-600 bg-emerald-500/10", danger: "text-destructive bg-destructive/10", neutral: "text-muted-foreground bg-muted" }[tone];
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

function RoleBar({ label, count, total, tone }: { label: string; count: number; total: number; tone: "info" | "success" | "danger" }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  const bar = { info: "bg-primary", success: "bg-emerald-500", danger: "bg-destructive" }[tone];
  return (
    <li>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-muted-foreground">{count} · {pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

function Health({ ok, title, hint, link }: { ok: boolean; title: string; hint: string; link?: string }) {
  const body = (
    <div className={`rounded-2xl border p-4 transition ${ok ? "border-emerald-500/25 bg-emerald-500/5" : "border-orange/30 bg-orange/5"} ${link ? "cursor-pointer hover:shadow-card" : ""}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${ok ? "bg-emerald-500/15 text-emerald-600" : "bg-orange/15 text-orange"}`}>
          {ok ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  );
  return <li>{link ? <Link to={link}>{body}</Link> : body}</li>;
}
