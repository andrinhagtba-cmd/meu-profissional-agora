import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração — ProConecta" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  if (isLoading) {
    return <SiteLayout><div className="container-page py-16 text-sm text-muted-foreground">Carregando…</div></SiteLayout>;
  }

  if (!isAdmin) {
    return (
      <SiteLayout>
        <div className="container-page py-20 text-center">
          <ShieldAlert className="mx-auto mb-4 text-orange" size={48} />
          <h1 className="font-display text-2xl font-bold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">Apenas administradores podem acessar esta área.</p>
        </div>
      </SiteLayout>
    );
  }

  const tabs = [
    { to: "/admin", label: "Visão geral" },
    { to: "/admin/usuarios", label: "Usuários" },
    { to: "/admin/profissionais", label: "Profissionais" },
    { to: "/admin/pedidos", label: "Pedidos" },
    { to: "/admin/avaliacoes", label: "Avaliações" },
  ];

  return (
    <SiteLayout>
      <div className="container-page py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold">Painel administrativo</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestão da plataforma ProConecta.</p>
        </div>
        <nav className="mb-6 flex flex-wrap gap-2 border-b border-border">
          {tabs.map((t) => {
            const active = pathname === t.to || (t.to !== "/admin" && pathname.startsWith(t.to));
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  active ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <Outlet />
      </div>
    </SiteLayout>
  );
}
