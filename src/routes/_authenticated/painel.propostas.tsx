import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  getMyProProfile,
  listMyProposals,
  withdrawProposal,
} from "@/services/professionalDashboardService";
import { getOrCreateConversation } from "@/services/chatService";
import { MessageSquare } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/painel/propostas")({
  head: () => ({
    meta: [
      { title: "Minhas propostas — ProConecta" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PropostasPage,
});

const statusMap: Record<string, { label: string; className: string }> = {
  sent: { label: "Enviada", className: "bg-primary/10 text-primary" },
  viewed: { label: "Visualizada", className: "bg-secondary text-primary" },
  accepted: { label: "Aceita", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Recusada", className: "bg-red-100 text-red-700" },
  withdrawn: { label: "Retirada", className: "bg-muted text-muted-foreground" },
};

function PropostasPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: pro } = useQuery({
    queryKey: ["myProProfile", user?.id],
    enabled: !!user?.id,
    queryFn: () => getMyProProfile(user!.id),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["myProposals", pro?.id],
    enabled: !!pro?.id,
    queryFn: () => listMyProposals(pro!.id),
  });

  const withdraw = useMutation({
    mutationFn: withdrawProposal,
    onSuccess: () => {
      toast.success("Proposta retirada.");
      qc.invalidateQueries({ queryKey: ["myProposals"] });
    },
    onError: () => toast.error("Erro ao retirar proposta"),
  });

  return (
    <SiteLayout>
      <div className="container-page py-10 lg:py-14">
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground">
            <Link to="/painel" className="hover:text-primary">Painel</Link> · Propostas
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground lg:text-4xl">
            Minhas propostas
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe o status das propostas que você enviou.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-3xl" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-4">
            {data.map((p) => {
              const s = statusMap[p.status] ?? { label: p.status, className: "bg-muted" };
              return (
                <article key={p.id} className="rounded-3xl border border-border bg-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`rounded-full ${s.className}`}>{s.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <h2 className="mt-2 font-display text-lg font-bold text-foreground">
                        {p.quote?.title ?? "Pedido"}
                      </h2>
                      {p.quote && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {p.quote.city}/{p.quote.state}
                        </p>
                      )}
                      {p.message && (
                        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{p.message}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {p.estimated_price != null && (
                          <span className="font-semibold text-foreground">
                            R$ {Number(p.estimated_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        {p.estimated_deadline && <span>Prazo: {p.estimated_deadline}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {p.status === "accepted" && pro?.id && (
                        <OpenChat quoteId={p.quote_request_id} proId={pro.id} />
                      )}
                      {p.status === "sent" && (
                        <Button
                          variant="outline"
                          onClick={() => withdraw.mutate(p.id)}
                          disabled={withdraw.isPending}
                        >
                          Retirar
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <p className="font-display text-lg font-bold text-foreground">
              Você ainda não enviou propostas
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Confira os leads disponíveis e envie sua primeira proposta.
            </p>
            <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/painel/leads">Ver leads</Link>
            </Button>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function OpenChat({ quoteId, proId }: { quoteId: string; proId: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  return (
    <Button
      onClick={async () => {
        setLoading(true);
        try {
          const id = await getOrCreateConversation(quoteId, proId);
          navigate({ to: "/painel/mensagens/$id", params: { id } });
        } catch (e) {
          toast.error((e as Error).message ?? "Erro ao abrir chat");
        } finally { setLoading(false); }
      }}
      disabled={loading}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      <MessageSquare size={14} className="mr-1" /> Abrir chat
    </Button>
  );
}
