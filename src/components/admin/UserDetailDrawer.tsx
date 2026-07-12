import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BadgeCheck, Bell, CalendarDays, ClipboardList, ExternalLink, Heart,
  Mail, MapPin, MessageSquareQuote, Phone, ShieldCheck, Star, User as UserIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { InitialsAvatar, StatusPill } from "@/components/admin/AdminTable";
import { getUserDetail } from "@/services/adminService";
import type { ReactNode } from "react";

type Props = { userId: string | null; open: boolean; onOpenChange: (o: boolean) => void };

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo", suspended: "Suspenso", pending: "Pendente", banned: "Banido",
};

export function UserDetailDrawer({ userId, open, onOpenChange }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: () => getUserDetail(userId!),
    enabled: !!userId && open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="sr-only">
          <SheetTitle>Detalhes do usuário</SheetTitle>
        </SheetHeader>

        {isLoading && (
          <div className="space-y-4 p-6">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        )}

        {error && !isLoading && (
          <div className="p-6 text-sm text-destructive">{(error as Error).message}</div>
        )}

        {data && !isLoading && (
          <div className="space-y-5 pb-8">
            {/* Hero */}
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_92%,white),color-mix(in_oklab,var(--primary)_60%,var(--orange)))] px-6 pb-14 pt-16 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.25),transparent_30%)]" />
              <div className="relative flex items-start gap-4">
                {data.avatar_url ? (
                  <img src={data.avatar_url} alt={data.full_name ?? "Usuário"} className="h-20 w-20 rounded-full border-4 border-white/90 object-cover shadow-lg" />
                ) : (
                  <InitialsAvatar name={data.full_name ?? data.email ?? "?"} className="h-20 w-20 border-4 border-white/90 text-2xl shadow-lg" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-display text-2xl font-extrabold">{data.full_name ?? "Sem nome"}</h2>
                    {data.roles.includes("admin") && <BadgeCheck size={20} className="text-white" />}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-white/85">{data.email ?? "—"}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {data.roles.length === 0 && <PillLight>sem papel</PillLight>}
                    {data.roles.map((r) => <PillLight key={r}>{r}</PillLight>)}
                    <PillLight>{STATUS_LABEL[data.account_status ?? "active"] ?? data.account_status}</PillLight>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mx-6 -mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={<ClipboardList size={16} />} label="Pedidos" value={data.stats.quote_requests} />
              <StatCard icon={<MessageSquareQuote size={16} />} label="Propostas" value={data.stats.proposals_received} />
              <StatCard icon={<Heart size={16} />} label="Favoritos" value={data.stats.favorites} />
              <StatCard icon={<Star size={16} />} label="Avaliações" value={data.stats.reviews_given} />
            </div>

            {/* Contact */}
            <Section title="Dados de contato">
              <Field icon={<Mail size={14} />} label="Email" value={data.email} />
              <Field icon={<Phone size={14} />} label="Telefone" value={data.phone} />
              <Field icon={<MapPin size={14} />} label="Localização" value={data.city ? `${data.city}/${data.state ?? ""}` : null} />
              <Field icon={<UserIcon size={14} />} label="ID interno" value={<code className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{data.user_id}</code>} />
            </Section>

            {/* Cliente info */}
            {data.client_profile && (
              <Section title="Perfil de cliente">
                <Field icon={<ShieldCheck size={14} />} label="CPF" value={data.client_profile.cpf} />
                <Field icon={<Bell size={14} />} label="Contato preferido" value={data.client_profile.preferred_contact} />
                <Field icon={<CalendarDays size={14} />} label="Cliente desde" value={new Date(data.client_profile.created_at).toLocaleDateString("pt-BR")} />
              </Section>
            )}

            {/* Timestamps */}
            <Section title="Atividade da conta">
              <Field icon={<CalendarDays size={14} />} label="Cadastrado em" value={new Date(data.created_at).toLocaleString("pt-BR")} />
              <Field icon={<CalendarDays size={14} />} label="Atualizado em" value={new Date(data.updated_at).toLocaleString("pt-BR")} />
              <Field icon={<Bell size={14} />} label="Notificações não lidas" value={String(data.stats.unread_notifications)} />
            </Section>

            {/* Recent quotes */}
            <Section title={`Pedidos recentes (${data.recent_quotes.length})`}>
              {data.recent_quotes.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum pedido registrado.</p>
              ) : (
                <ul className="space-y-2">
                  {data.recent_quotes.map((q) => (
                    <li key={q.id} className="flex items-start justify-between gap-3 rounded-xl border bg-card px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">{q.title}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {q.city ? `${q.city}/${q.state} · ` : ""}{new Date(q.created_at).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <StatusPill tone="neutral">{q.status}</StatusPill>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Favorites */}
            <Section title={`Profissionais favoritos (${data.recent_favorites.length})`}>
              {data.recent_favorites.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum favorito.</p>
              ) : (
                <ul className="space-y-2">
                  {data.recent_favorites.map((f) => (
                    <li key={f.professional_id} className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{f.professional_name ?? "Profissional"}</div>
                        <div className="text-[11px] text-muted-foreground">Favoritado em {new Date(f.created_at).toLocaleDateString("pt-BR")}</div>
                      </div>
                      {f.slug && (
                        <a href={`/profissional/${f.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                          Ver <ExternalLink size={12} />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <div className="px-6">
              <Link
                to="/admin/usuarios"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
              >
                Ver todos os usuários
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function PillLight({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur">{children}</span>;
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border bg-card px-3 py-3 shadow-card">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span>{label}
      </div>
      <div className="mt-1 font-display text-xl font-extrabold text-foreground">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-6 space-y-3 rounded-2xl border bg-card p-4 shadow-card">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Field({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <span className="text-primary">{icon}</span>{label}
      </div>
      <div className="min-w-0 text-right text-sm text-foreground">{value ?? <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}
