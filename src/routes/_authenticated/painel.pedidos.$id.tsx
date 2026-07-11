import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock,
  MapPin,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  acceptProposalRpc,
  getMyQuote,
  listProposalsForQuote,
  rejectProposalRpc,
  type ReceivedProposal,
} from "@/services/clientService";
import { getReviewForQuote, submitReview } from "@/services/adminService";
import { getOrCreateConversation } from "@/services/chatService";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/painel/pedidos/$id")({
  head: () => ({
    meta: [
      { title: "Propostas recebidas — ProConecta" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PedidoDetalhe,
});

const STATUS_LABEL: Record<string, string> = {
  open: "Aberto",
  receiving_proposals: "Recebendo propostas",
  professional_selected: "Profissional selecionado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  expired: "Expirado",
};

const PRICE_TYPE_LABEL: Record<string, string> = {
  fixed: "valor fixo",
  hourly: "por hora",
  daily: "por diária",
  per_visit: "por visita",
  to_quote: "a combinar",
};

function PedidoDetalhe() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const quote = useQuery({
    queryKey: ["quote", id],
    queryFn: () => getMyQuote(id),
  });
  const proposals = useQuery({
    queryKey: ["proposals", id],
    queryFn: () => listProposalsForQuote(id),
  });

  const accept = useMutation({
    mutationFn: (pid: string) => acceptProposalRpc(pid),
    onSuccess: () => {
      toast.success("Proposta aceita! O profissional foi notificado.");
      qc.invalidateQueries({ queryKey: ["quote", id] });
      qc.invalidateQueries({ queryKey: ["proposals", id] });
      qc.invalidateQueries({ queryKey: ["my-quotes"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao aceitar proposta"),
  });

  const reject = useMutation({
    mutationFn: (pid: string) => rejectProposalRpc(pid),
    onSuccess: () => {
      toast.success("Proposta recusada.");
      qc.invalidateQueries({ queryKey: ["proposals", id] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao recusar"),
  });

  const q = quote.data;
  const selectedId = q?.selected_professional_id ?? null;

  return (
    <SiteLayout>
      <div className="container-page py-10 lg:py-14">
        <button
          onClick={() => navigate({ to: "/painel/pedidos" })}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft size={14} /> Voltar aos pedidos
        </button>

        {quote.isLoading ? (
          <Skeleton className="mt-4 h-24 rounded-3xl" />
        ) : !q ? (
          <p className="mt-6 text-sm text-muted-foreground">Pedido não encontrado.</p>
        ) : (
          <div className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              {q.category?.name && (
                <Badge className="rounded-full bg-secondary text-[11px] font-semibold text-primary hover:bg-secondary">
                  {q.category.name}
                </Badge>
              )}
              <Badge variant="outline" className="rounded-full text-[11px]">
                {STATUS_LABEL[q.status] ?? q.status}
              </Badge>
            </div>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-foreground lg:text-3xl">
              {q.title}
            </h1>
            {q.description && (
              <p className="mt-2 text-sm text-muted-foreground">{q.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} className="text-primary" />
                {q.neighborhood ? `${q.neighborhood}, ` : ""}
                {q.city}/{q.state}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} className="text-primary" />
                {new Date(q.created_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>
        )}

        <h2 className="mt-8 font-display text-xl font-bold text-foreground">
          Propostas recebidas
        </h2>
        {proposals.isLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-3xl" />
            ))}
          </div>
        ) : !proposals.data || proposals.data.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhuma proposta ainda. Assim que profissionais responderem, aparecerão aqui.
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {proposals.data.map((p) => (
              <ProposalCard
                key={p.id}
                p={p}
                quoteId={id}
                isSelected={selectedId === p.professional?.id}
                canAct={
                  !selectedId &&
                  p.status !== "rejected" &&
                  p.status !== "withdrawn"
                }
                onAccept={() => accept.mutate(p.id)}
                onReject={() => reject.mutate(p.id)}
                pending={accept.isPending || reject.isPending}
              />
            ))}
          </ul>
        )}

        {q && (q.status === "professional_selected" || q.status === "completed" || q.status === "in_progress") && (
          <ReviewSection quoteId={q.id} />
        )}
      </div>
    </SiteLayout>
  );
}

function ReviewSection({ quoteId }: { quoteId: string }) {
  const qc = useQueryClient();
  const existing = useQuery({
    queryKey: ["review", quoteId],
    queryFn: () => getReviewForQuote(quoteId),
  });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const send = useMutation({
    mutationFn: () => submitReview(quoteId, rating, comment),
    onSuccess: () => {
      toast.success("Avaliação enviada! Obrigado.");
      qc.invalidateQueries({ queryKey: ["review", quoteId] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao enviar"),
  });

  if (existing.isLoading) return null;

  if (existing.data) {
    return (
      <div className="mt-10 rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold">Sua avaliação</h2>
        <div className="mt-2 flex items-center gap-1 text-orange">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={18} className={i < existing.data!.rating ? "fill-orange" : ""} />
          ))}
        </div>
        {existing.data.comment && <p className="mt-2 text-sm text-muted-foreground">{existing.data.comment}</p>}
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-3xl border border-border bg-card p-6">
      <h2 className="font-display text-xl font-bold">Deixe sua avaliação</h2>
      <p className="mt-1 text-sm text-muted-foreground">Como foi o atendimento do profissional?</p>
      <div className="mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} type="button" className="p-1">
            <Star size={28} className={n <= rating ? "fill-orange text-orange" : "text-muted-foreground"} />
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Conte sobre a experiência (opcional)"
        className="mt-4 min-h-24 rounded-2xl"
      />
      <Button
        onClick={() => send.mutate()}
        disabled={send.isPending}
        className="mt-4 rounded-xl bg-orange font-semibold text-orange-foreground hover:bg-orange/90"
      >
        Enviar avaliação
      </Button>
    </div>
  );
}

function ProposalCard({
  p,
  isSelected,
  canAct,
  onAccept,
  onReject,
  pending,
}: {
  p: ReceivedProposal;
  isSelected: boolean;
  canAct: boolean;
  onAccept: () => void;
  onReject: () => void;
  pending: boolean;
}) {
  const pro = p.professional;
  const name = pro?.professional_name || pro?.business_name || "Profissional";
  const price =
    p.estimated_price != null
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(Number(p.estimated_price))
      : "A combinar";
  return (
    <li
      className={`rounded-3xl border p-6 shadow-card ${
        isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-bold text-foreground">{name}</h3>
            {pro?.verification_status === "verified" && (
              <BadgeCheck size={16} className="text-primary" />
            )}
            {isSelected && (
              <Badge className="rounded-full bg-primary text-[11px] font-semibold text-primary-foreground hover:bg-primary">
                Selecionado
              </Badge>
            )}
            {p.status === "rejected" && (
              <Badge variant="outline" className="rounded-full text-[11px]">
                Recusada
              </Badge>
            )}
            {p.status === "withdrawn" && (
              <Badge variant="outline" className="rounded-full text-[11px]">
                Retirada
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {pro?.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {pro.city}/{pro.state}
              </span>
            )}
            {pro?.average_rating != null && (
              <span className="inline-flex items-center gap-1">
                <Star size={12} className="fill-orange text-orange" />
                {Number(pro.average_rating).toFixed(1)} ({pro.reviews_count ?? 0})
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-extrabold text-foreground">{price}</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {PRICE_TYPE_LABEL[p.price_type ?? "to_quote"] ?? "a combinar"}
          </p>
        </div>
      </div>

      {p.message && (
        <p className="mt-3 whitespace-pre-line rounded-2xl bg-secondary/60 p-4 text-sm text-foreground">
          {p.message}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {pro?.slug ? (
          <Link
            to="/profissional/$slug"
            params={{ slug: pro.slug }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Ver perfil completo →
          </Link>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-2">
          {isSelected && pro?.id && <OpenChatButton quoteId={p.quote_request_id ?? ""} proId={pro.id} />}
          {canAct && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onReject}
                disabled={pending}
                className="h-9 rounded-xl"
              >
                <X size={14} className="mr-1" /> Recusar
              </Button>
              <Button
                size="sm"
                onClick={onAccept}
                disabled={pending}
                className="h-9 rounded-xl bg-orange px-4 font-semibold text-orange-foreground hover:bg-orange/90"
              >
                <Check size={14} className="mr-1" /> Aceitar
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function OpenChatButton({ quoteId, proId }: { quoteId: string; proId: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const openChat = async () => {
    if (!quoteId || !proId) return;
    setLoading(true);
    try {
      const convId = await getOrCreateConversation(quoteId, proId);
      navigate({ to: "/painel/mensagens/$id", params: { id: convId } });
    } catch (e) {
      toast.error((e as Error).message ?? "Erro ao abrir chat");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button
      size="sm"
      onClick={openChat}
      disabled={loading}
      className="h-9 rounded-xl bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90"
    >
      <MessageSquare size={14} className="mr-1" /> Abrir chat
    </Button>
  );
}
