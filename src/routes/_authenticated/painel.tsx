import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Heart, MessageSquare, Star, User as UserIcon } from "lucide-react";

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
      const [profile, roles] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
      ]);
      return {
        profile: profile.data,
        roles: (roles.data ?? []).map((r) => r.role as string),
      };
    },
  });

  const isProfissional = data?.roles.includes("profissional");
  const isAdmin = data?.roles.includes("admin");

  return (
    <SiteLayout>
      <div className="container-page py-10 lg:py-14">
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground">Olá,</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground lg:text-4xl">
            {isLoading ? <Skeleton className="h-9 w-64" /> : data?.profile?.full_name || user?.email}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isAdmin ? "Painel administrativo" : isProfissional ? "Painel do profissional" : "Painel do cliente"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isProfissional ? (
            <>
              <StatCard icon={<Briefcase />} label="Pedidos recebidos" value="—" />
              <StatCard icon={<MessageSquare />} label="Propostas enviadas" value="—" />
              <StatCard icon={<Star />} label="Avaliação média" value="—" />
              <StatCard icon={<UserIcon />} label="Perfil" value="Editar" />
            </>
          ) : (
            <>
              <StatCard icon={<MessageSquare />} label="Meus pedidos" value="—" />
              <StatCard icon={<Heart />} label="Favoritos" value="—" />
              <StatCard icon={<Star />} label="Minhas avaliações" value="—" />
              <StatCard icon={<UserIcon />} label="Perfil" value="Editar" />
            </>
          )}
        </div>

        <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Em breve: gestão completa de pedidos, propostas, favoritos e avaliações — integrada ao banco de dados real.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">{icon}</span>
        <div>
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-0.5 text-lg font-bold text-foreground">{value}</div>
        </div>
      </div>
    </div>
  );
}
