import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { listMyConversations } from "@/services/chatService";
import { MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/painel/mensagens/")({
  head: () => ({
    meta: [
      { title: "Mensagens" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MensagensList,
});

function MensagensList() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user?.id,
    queryFn: () => listMyConversations(user!.id),
  });

  return (
    <SiteLayout>
      <div className="container-page py-10 lg:py-14">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold lg:text-4xl">Mensagens</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Converse com {isProSideHint()} sobre seus pedidos.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <MessageSquare className="mx-auto mb-3 text-muted-foreground" />
            <p className="font-display text-lg font-bold">Nenhuma conversa ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">
              As conversas são abertas automaticamente quando uma proposta é aceita.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {data.map((c) => {
              const isClient = c.client_id === user?.id;
              const unread = isClient ? c.client_unread_count : c.pro_unread_count;
              const otherName = isClient
                ? (c.professional?.professional_name || c.professional?.business_name || "Profissional")
                : (c.client?.full_name || "Cliente");
              return (
                <li key={c.id}>
                  <Link
                    to="/painel/mensagens/$id"
                    params={{ id: c.id }}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-display text-base font-bold">{otherName}</p>
                        {unread > 0 && (
                          <span className="rounded-full bg-orange px-2 py-0.5 text-[11px] font-bold text-orange-foreground">
                            {unread}
                          </span>
                        )}
                      </div>
                      {c.quote?.title && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">Pedido: {c.quote.title}</p>
                      )}
                      <p className="mt-1 truncate text-sm text-muted-foreground">
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
        )}
      </div>
    </SiteLayout>
  );
}

function isProSideHint() {
  return "clientes e profissionais";
}