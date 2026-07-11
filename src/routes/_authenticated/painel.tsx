import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Bell,
  Briefcase,
  CheckCircle2,
  Clock,
  Heart,
  ImagePlus,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  User as UserIcon,
  Wrench,
} from "lucide-react";
import {
  countMyQuotes,
  countUnreadNotifications,
  listFavoriteProfessionalIds,
  listMyQuotes,
  listNotifications,
} from "@/services/clientService";
import {
  countLeadsAvailable,
  countMyProposals,
  getMyProProfile,
} from "@/services/professionalDashboardService";
import { listMyConversations } from "@/services/chatService";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Meu painel — Guia DF na Mídia" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Painel,
});

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  open: "Aberto",
  receiving_proposals: "Recebendo propostas",
  professional_selected: "Profissional selecionado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  expired: "Expirado",
};

const STATUS_TONE: Record<string, string> = {
  open: "bg-blue-50 text-primary",
  receiving_proposals: "bg-orange/10 text-orange",
  professional_selected: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
  expired: "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
};

function Painel() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["painel", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [profile, roles, quotes, favs, unread, pro, recentQuotes, notifications, conversations] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
        countMyQuotes(user!.id),
        listFavoriteProfessionalIds(user!.id),
        countUnreadNotifications(user!.id),
        getMyProProfile(user!.id),
        listMyQuotes(user!.id).catch(() => []),
        listNotifications(user!.id).catch(() => []),
        listMyConversations(user!.id).catch(() => []),
      ]);
      const rolesList = (roles.data ?? []).map((r) => r.role as string);
      const isPro = rolesList.includes("profissional");
      const [leadsCount, proposalsCount] = isPro && pro
        ? await Promise.all([countLeadsAvailable(), countMyProposals(pro.id)])
        : [0, 0];
      return {
        profile: profile.data,
        roles: rolesList,
        quotes,
        favorites: favs.length,
        unread,
        pro,
        leadsCount,
        proposalsCount,
        recentQuotes: recentQuotes.slice(0, 4),
        notifications: notifications.slice(0, 4),
        conversations: conversations.slice(0, 4),
      };
    },
  });

  const isProfissional = data?.roles.includes("profissional");
  const isAdmin = data?.roles.includes("admin");
  const firstName = (data?.profile?.full_name || user?.email || "").split(" ")[0];

  return (
    <SiteLayout>
      <div className="container-page py-8 lg:py-12">
        {/* HERO PREMIUM */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary via-primary to-[#0a4bd8] p-8 text-primary-foreground shadow-card lg:p-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-orange/30 blur-3xl" aria-hidden="true" />

          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur">
                <Sparkles size={12} />
                {isAdmin ? "Administrador" : isProfissional ? "Profissional verificado" : "Cliente"}
              </div>
              <p className="text-sm font-medium text-white/80">Olá,</p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight lg:text-5xl">
                {isLoading ? (
                  <Skeleton className="h-10 w-72 bg-white/20" />
                ) : (
                  firstName || "Bem-vindo"
                )}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-white/85 lg:text-base">
                {isProfissional
                  ? "Acompanhe leads, propostas e mensagens dos seus clientes em um só lugar."
                  : "Acompanhe seus orçamentos, converse com profissionais e receba propostas em minutos."}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {!isProfissional && (
                  <Button
                    asChild
                    className="h-11 rounded-xl bg-orange px-5 font-semibold text-orange-foreground shadow-lg shadow-black/10 hover:bg-orange/90"
                  >
                    <Link to="/pedir-orcamento" search={{} as never}>
                      <Plus size={16} /> Pedir novo orçamento
                    </Link>
                  </Button>
                )}
                {isProfissional && (
                  <Button
                    asChild
                    className="h-11 rounded-xl bg-orange px-5 font-semibold text-orange-foreground shadow-lg shadow-black/10 hover:bg-orange/90"
                  >
                    <Link to="/painel/leads">
                      <Briefcase size={16} /> Ver leads disponíveis
                    </Link>
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-xl border-white/30 bg-white/10 px-5 font-semibold text-white hover:bg-white/20 hover:text-white"
                  >
                    <Link to="/admin">
                      <LayoutDashboard size={16} /> Painel administrativo
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="hidden shrink-0 lg:block">
              <div className="grid gap-2 text-right">
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-wide text-white/70">Conta</p>
                  <p className="mt-0.5 truncate text-sm font-semibold">{user?.email}</p>
                </div>
                {isProfissional && data?.pro && (
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-wide text-white/70">Perfil profissional</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold">
                      <ShieldCheck size={14} /> Ativo
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isProfissional ? (
            <>
              <KpiCard icon={<Briefcase />} label="Leads disponíveis" value={data?.leadsCount} loading={isLoading} to="/painel/leads" tone="blue" />
              <KpiCard icon={<MessageSquare />} label="Propostas enviadas" value={data?.proposalsCount} loading={isLoading} to="/painel/propostas" tone="orange" />
              <KpiCard
                icon={<Star />}
                label="Avaliação média"
                value={data?.pro?.average_rating != null ? Number(data.pro.average_rating).toFixed(1) : "—"}
                loading={isLoading}
                tone="amber"
              />
              <KpiCard icon={<Bell />} label="Notificações" value={data?.unread} loading={isLoading} to="/painel/notificacoes" tone="emerald" />
            </>
          ) : (
            <>
              <KpiCard icon={<MessageSquare />} label="Meus pedidos" value={data?.quotes} loading={isLoading} to="/painel/pedidos" tone="blue" />
              <KpiCard icon={<Heart />} label="Favoritos" value={data?.favorites} loading={isLoading} to="/favoritos" tone="orange" />
              <KpiCard icon={<Bell />} label="Notificações" value={data?.unread} loading={isLoading} to="/painel/notificacoes" tone="emerald" />
              <KpiCard icon={<UserIcon />} label="Perfil" value="Editar" loading={isLoading} to="/painel/perfil" tone="amber" />
            </>
          )}
        </section>

        {/* AÇÕES RÁPIDAS */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground lg:text-2xl">Ações rápidas</h2>
              <p className="text-sm text-muted-foreground">Acesse as áreas mais usadas do seu painel.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isProfissional ? (
              <>
                <ActionCard to="/painel/leads" title="Leads disponíveis" desc="Pedidos abertos onde você pode enviar propostas." icon={<Briefcase />} />
                <ActionCard to="/painel/propostas" title="Minhas propostas" desc="Status das propostas e mensagens dos clientes." icon={<MessageSquare />} />
                <ActionCard to="/painel/mensagens" title="Mensagens" desc="Converse com clientes após aceitar propostas." icon={<MessageSquare />} />
                <ActionCard to="/painel/servicos" title="Meus serviços" desc="Cadastre serviços que você oferece e defina preços." icon={<Wrench />} />
                <ActionCard to="/painel/midia" title="Foto, capa e portfólio" desc="Envie mídias que valorizam seu perfil." icon={<ImagePlus />} />
                <ActionCard to="/painel/perfil" title="Meu perfil" desc="Atualize seus dados públicos." icon={<UserIcon />} />
                <ActionCard to="/painel/notificacoes" title="Notificações" desc="Novidades sobre leads e propostas." icon={<Bell />} />
                <ActionCard to="/favoritos" title="Favoritos" desc="Profissionais que você acompanha." icon={<Heart />} />
              </>
            ) : (
              <>
                <ActionCard to="/painel/pedidos" title="Meus pedidos" desc="Acompanhe o status dos orçamentos solicitados." icon={<MessageSquare />} />
                <ActionCard to="/painel/mensagens" title="Mensagens" desc="Converse com o profissional escolhido." icon={<MessageSquare />} />
                <ActionCard to="/painel/notificacoes" title="Notificações" desc="Novas propostas, mensagens e atualizações." icon={<Bell />} />
                <ActionCard to="/painel/perfil" title="Meu perfil" desc="Nome, telefone e cidade — usados nos pedidos." icon={<UserIcon />} />
                <ActionCard to="/favoritos" title="Favoritos" desc="Profissionais que você salvou." icon={<Heart />} />
                <ActionCard to="/categorias" title="Explorar categorias" desc="Encontre serviços de todos os tipos." icon={<Sparkles />} />
                <ActionCard to="/profissionais" title="Profissionais" desc="Veja quem está disponível na sua região." icon={<Briefcase />} />
                <ActionCard to="/pedir-orcamento" title="Novo orçamento" desc="Receba propostas em minutos." icon={<Plus />} search={{} as never} />
              </>
            )}
          </div>
        </section>

        {/* ATIVIDADE RECENTE */}
        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* Pedidos recentes */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  {isProfissional ? "Últimas conversas" : "Pedidos recentes"}
                </h3>
                <p className="text-xs text-muted-foreground">Sincronizado com o banco em tempo real.</p>
              </div>
              <Link
                to={isProfissional ? "/painel/mensagens" : "/painel/pedidos"}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Ver tudo <ArrowRight size={14} />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
              </div>
            ) : isProfissional ? (
              data?.conversations?.length ? (
                <ul className="divide-y divide-border">
                  {data.conversations.map((c) => {
                    const otherName = c.client?.full_name || "Cliente";
                    const unread = c.pro_unread_count || 0;
                    return (
                      <li key={c.id}>
                        <Link
                          to="/painel/mensagens/$id"
                          params={{ id: c.id }}
                          className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-xl"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-semibold text-foreground">{otherName}</p>
                              {unread > 0 && (
                                <span className="rounded-full bg-orange px-2 py-0.5 text-[10px] font-bold text-orange-foreground">
                                  {unread}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">
                              {c.last_message_preview || "Sem mensagens ainda"}
                            </p>
                          </div>
                          {c.last_message_at && (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {new Date(c.last_message_at).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState icon={<MessageSquare />} label="Nenhuma conversa ainda" />
              )
            ) : data?.recentQuotes?.length ? (
              <ul className="divide-y divide-border">
                {data.recentQuotes.map((q) => (
                  <li key={q.id}>
                    <Link
                      to="/painel/pedidos/$id"
                      params={{ id: q.id }}
                      className="flex items-start justify-between gap-4 py-4 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-xl"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {q.category?.name && (
                            <Badge className="rounded-full bg-secondary text-[10px] font-semibold text-primary hover:bg-secondary">
                              {q.category.name}
                            </Badge>
                          )}
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_TONE[q.status] ?? "bg-muted text-muted-foreground"}`}>
                            {STATUS_LABEL[q.status] ?? q.status}
                          </span>
                        </div>
                        <p className="mt-1.5 truncate font-semibold text-foreground">{q.title}</p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin size={11} /> {q.city}/{q.state}
                          <span className="mx-1">·</span>
                          <Clock size={11} /> {new Date(q.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <ArrowRight size={16} className="mt-2 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<MessageSquare />}
                label="Você ainda não fez nenhum pedido"
                cta={
                  <Button asChild className="mt-3 h-10 rounded-xl bg-orange px-4 font-semibold text-orange-foreground hover:bg-orange/90">
                    <Link to="/pedir-orcamento" search={{} as never}>Pedir orçamento</Link>
                  </Button>
                }
              />
            )}
          </div>

          {/* Notificações recentes */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Notificações</h3>
                <p className="text-xs text-muted-foreground">{data?.unread ?? 0} não lidas</p>
              </div>
              <Link to="/painel/notificacoes" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                Ver <ArrowRight size={14} />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : data?.notifications?.length ? (
              <ul className="space-y-2">
                {data.notifications.map((n) => (
                  <li key={n.id} className={`rounded-xl border p-3 ${n.read ? "border-border bg-background" : "border-primary/30 bg-secondary/40"}`}>
                    <div className="flex items-start gap-2">
                      {!n.read ? (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
                        {n.message && <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>}
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(n.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<Bell />} label="Sem notificações" small />
            )}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

/* ---------- Sub-components ---------- */

const TONES: Record<string, string> = {
  blue: "bg-blue-50 text-primary",
  orange: "bg-orange/10 text-orange",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
};

function KpiCard({
  icon,
  label,
  value,
  loading,
  to,
  tone = "blue",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  loading?: boolean;
  to?: string;
  tone?: "blue" | "orange" | "amber" | "emerald";
}) {
  const navigate = useNavigate();
  const open = () => {
    if (to) navigate({ to: to as never });
  };
  const inner = (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <div className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground">
            {loading ? <Skeleton className="h-8 w-14" /> : (value ?? 0)}
          </div>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${TONES[tone]}`}>
          {icon}
        </span>
      </div>
      {to && (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
          Abrir <ArrowRight size={12} />
        </span>
      )}
    </div>
  );
  return to ? (
    <button
      type="button"
      onClick={open}
      className="block h-full w-full cursor-pointer rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`Abrir ${label}`}
    >
      {inner}
    </button>
  ) : inner;
}

function ActionCard({
  to,
  title,
  desc,
  icon,
  search,
}: {
  to: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  search?: never;
}) {
  const navigate = useNavigate();
  const open = () => navigate({ to: to as never, search });

  return (
    <button
      type="button"
      onClick={open}
      className="group flex h-full w-full cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`Abrir ${title}`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-display text-sm font-bold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

function EmptyState({
  icon,
  label,
  cta,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  cta?: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-dashed border-border bg-muted/20 text-center ${small ? "p-6" : "p-8"}`}>
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
        {icon}
      </div>
      <p className="mt-3 text-sm font-medium text-muted-foreground">{label}</p>
      {cta}
    </div>
  );
}
