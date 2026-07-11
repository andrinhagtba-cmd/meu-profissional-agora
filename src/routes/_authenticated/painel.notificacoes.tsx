import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/clientService";

export const Route = createFileRoute("/_authenticated/painel/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — ProConecta" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Notificacoes,
});

function Notificacoes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: () => listNotifications(user!.id),
  });

  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["painel"] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["painel"] });
      toast.success("Todas marcadas como lidas.");
    },
  });

  return (
    <SiteLayout>
      <div className="container-page py-10 lg:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              <Link to="/painel" className="hover:text-primary">← Voltar ao painel</Link>
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground lg:text-4xl">
              Notificações
            </h1>
          </div>
          <Button
            variant="outline"
            className="h-11 rounded-xl px-5 font-semibold"
            disabled={markAll.isPending || !data?.some((n) => !n.read)}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck size={16} /> Marcar todas como lidas
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center">
            <Bell className="mx-auto text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhuma notificação por enquanto.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {data.map((n) => (
              <li
                key={n.id}
                className={`rounded-2xl border p-5 transition-colors ${
                  n.read ? "border-border bg-card" : "border-primary/30 bg-secondary/50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />}
                      <h2 className="font-display text-base font-bold text-foreground">{n.title}</h2>
                    </div>
                    {n.message && (
                      <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markOne.mutate(n.id)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Marcar lida
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SiteLayout>
  );
}
