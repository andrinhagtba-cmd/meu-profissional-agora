import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = useAuth();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Carregando painel administrativo…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div className="max-w-md">
          <ShieldAlert className="mx-auto mb-4 text-orange" size={48} />
          <h1 className="font-display text-2xl font-extrabold text-foreground">
            Acesso restrito
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Você não possui permissão para acessar o painel administrativo.
            Se acredita que isso é um erro, entre em contato com um administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="admin-shell flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <main className="flex-1 px-3 pb-[calc(72px+env(safe-area-inset-bottom))] pt-4 sm:p-6 md:pb-8 lg:p-8">
            <Outlet />
          </main>
          <AdminMobileNav />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
