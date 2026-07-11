import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Briefcase,
  Heart,
  ImagePlus,
  MessageSquare,
  Star,
  User as UserIcon,
  Wrench,
} from "lucide-react";
import {
  countMyQuotes,
  countUnreadNotifications,
  listFavoriteProfessionalIds,
} from "@/services/clientService";
import {
  countLeadsAvailable,
  countMyProposals,
  getMyProProfile,
} from "@/services/professionalDashboardService";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Meu painel — ProConecta" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Painel,
});

function Painel() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["painel", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [profile, roles, quotes, favs, unread, pro] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
        countMyQuotes(user!.id),
        listFavoriteProfessionalIds(user!.id),
        countUnreadNotifications(user!.id),
        getMyProProfile(user!.id),
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
      };
    },
  });


  const isProfissional = data?.roles.includes("profissional");
  const isAdmin = data?.roles.includes("admin");

  return (
    <SiteLayout>
      <div className="container-page py-10 lg:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Olá,</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground lg:text-4xl">
              {isLoading ? (
                <Skeleton className="h-9 w-64" />
              ) : (
                data?.profile?.full_name || user?.email
              )}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isAdmin
                ? "Painel administrativo"
                : isProfissional
                  ? "Painel do profissional"
                  : "Painel do cliente"}
            </p>
          </div>
          {!isProfissional && (
            <Button asChild className="h-11 rounded-xl bg-orange px-5 font-semibold text-orange-foreground hover:bg-orange/90">
              <Link to="/pedir-orcamento" search={{} as never}>Pedir novo orçamento</Link>
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isProfissional ? (
            <>
              <StatCard
                icon={<Briefcase />}
                label="Leads disponíveis"
                value={isLoading ? "…" : String(data?.leadsCount ?? 0)}
                to="/painel/leads"
              />
              <StatCard
                icon={<MessageSquare />}
                label="Propostas enviadas"
                value={isLoading ? "…" : String(data?.proposalsCount ?? 0)}
                to="/painel/propostas"
              />
              <StatCard
                icon={<Star />}
                label="Avaliação média"
                value={
                  isLoading
                    ? "…"
                    : data?.pro?.average_rating != null
                      ? Number(data.pro.average_rating).toFixed(1)
                      : "—"
                }
              />
              <StatCard
                icon={<UserIcon />}
                label="Perfil"
                value="Editar"
                to="/painel/perfil"
              />
            </>
          ) : (
            <>
              <StatCard
                icon={<MessageSquare />}
                label="Meus pedidos"
                value={isLoading ? "…" : String(data?.quotes ?? 0)}
                to="/painel/pedidos"
              />
              <StatCard
                icon={<Heart />}
                label="Favoritos"
                value={isLoading ? "…" : String(data?.favorites ?? 0)}
                to="/favoritos"
              />
              <StatCard
                icon={<Bell />}
                label="Notificações"
                value={isLoading ? "…" : String(data?.unread ?? 0)}
                to="/painel/notificacoes"
              />
              <StatCard
                icon={<UserIcon />}
                label="Perfil"
                value="Editar"
                to="/painel/perfil"
              />
            </>
          )}
        </div>

        {isProfissional && (
          <>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              <PanelLink
                to="/painel/leads"
                title="Leads disponíveis"
                desc="Pedidos abertos onde você pode enviar propostas."
                icon={<Briefcase />}
              />
              <PanelLink
                to="/painel/propostas"
                title="Minhas propostas"
                desc="Status das propostas enviadas e mensagens dos clientes."
                icon={<MessageSquare />}
              />
              <PanelLink
                to="/painel/servicos"
                title="Meus serviços"
                desc="Cadastre serviços que você oferece e defina preços."
                icon={<Wrench />}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary">
                  <ImagePlus size={20} />
                </span>
                <div>
                  <p className="font-display text-base font-bold text-foreground">
                    Foto, capa e portfólio
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Envie sua foto de perfil, capa e trabalhos recentes.
                  </p>
                </div>
              </div>
              <Link
                to="/painel/midia"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Gerenciar mídia
              </Link>
            </div>
          </>
        )}

        {!isProfissional && (
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <PanelLink
              to="/painel/pedidos"
              title="Meus pedidos"
              desc="Acompanhe o status dos orçamentos que você solicitou."
              icon={<MessageSquare />}
            />
            <PanelLink
              to="/painel/notificacoes"
              title="Notificações"
              desc="Novas propostas, mensagens e atualizações."
              icon={<Bell />}
            />
            <PanelLink
              to="/painel/perfil"
              title="Meu perfil"
              desc="Nome, telefone e cidade — usados nos pedidos."
              icon={<UserIcon />}
            />
          </div>
        )}
      </div>
    </SiteLayout>
  );
}


function StatCard({
  icon,
  label,
  value,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  to?: string;
}) {
  const inner = (
    <div className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
          {icon}
        </span>
        <div>
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-0.5 text-lg font-bold text-foreground">{value}</div>
        </div>
      </div>
    </div>
  );
  if (to) {
    return (
      <Link to={to} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

function PanelLink({
  to,
  title,
  desc,
  icon,
}: {
  to: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-4 rounded-3xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary">
        {icon}
      </span>
      <div>
        <p className="font-display text-base font-bold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}
