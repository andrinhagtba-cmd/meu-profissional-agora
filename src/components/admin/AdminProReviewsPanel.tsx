import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star, Check, X, Flag, Clock, Trash2 } from "lucide-react";
import { listProReviews, setReviewStatus, deleteReview, type ReviewStatus, type AdminProReview } from "@/services/adminService";

const statusLabel: Record<ReviewStatus, string> = {
  pending: "Pendente", approved: "Aprovada", rejected: "Rejeitada", flagged: "Sinalizada",
};
const statusVariant: Record<ReviewStatus, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default", pending: "secondary", flagged: "outline", rejected: "destructive",
};

export function AdminProReviewsPanel({ professionalId }: { professionalId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-pro-reviews", professionalId],
    queryFn: () => listProReviews(professionalId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-pro-reviews", professionalId] });
    qc.invalidateQueries({ queryKey: ["admin-pro-detail", professionalId] });
  };

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReviewStatus }) => setReviewStatus(id, status),
    onSuccess: (_d, v) => {
      toast.success(`Avaliação marcada como ${statusLabel[v.status].toLowerCase()}`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => { toast.success("Avaliação removida"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const reviews = data ?? [];
  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === "pending").length,
    approved: reviews.filter(r => r.status === "approved").length,
    flagged: reviews.filter(r => r.status === "flagged").length,
    avg: reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Média" value={stats.avg.toFixed(2) + " ★"} />
        <StatCard label="Aprovadas" value={stats.approved} />
        <StatCard label="Pendentes" value={stats.pending} />
        <StatCard label="Sinalizadas" value={stats.flagged} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Este profissional ainda não recebeu avaliações.</div>
          ) : (
            <ul className="divide-y">
              {reviews.map((r) => (
                <ReviewRow key={r.id} review={r}
                  onStatus={(status) => setStatus.mutate({ id: r.id, status })}
                  onDelete={() => { if (confirm("Remover esta avaliação?")) remove.mutate(r.id); }}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </CardContent></Card>
  );
}

function ReviewRow({ review, onStatus, onDelete }: {
  review: AdminProReview;
  onStatus: (s: ReviewStatus) => void;
  onDelete: () => void;
}) {
  return (
    <li className="p-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
            ))}
          </div>
          <Badge variant={statusVariant[review.status]}>{statusLabel[review.status]}</Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString("pt-BR")}
          </span>
        </div>
        <div className="mt-1 text-sm">
          <span className="font-medium">{review.client_name ?? "Cliente"}</span>
          {review.quote_title && <span className="text-muted-foreground"> · {review.quote_title}</span>}
        </div>
        {review.comment && <p className="mt-2 text-sm text-foreground/90 whitespace-pre-line">{review.comment}</p>}
        {review.professional_reply && (
          <div className="mt-2 rounded-md bg-muted/50 p-2 text-sm">
            <div className="text-xs font-medium text-muted-foreground mb-1">Resposta do profissional</div>
            {review.professional_reply}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
        <Button size="sm" variant="outline" onClick={() => onStatus("approved")}><Check className="h-3.5 w-3.5 mr-1" />Aprovar</Button>
        <Button size="sm" variant="outline" onClick={() => onStatus("pending")}><Clock className="h-3.5 w-3.5 mr-1" />Pendente</Button>
        <Button size="sm" variant="outline" onClick={() => onStatus("flagged")}><Flag className="h-3.5 w-3.5 mr-1" />Sinalizar</Button>
        <Button size="sm" variant="outline" onClick={() => onStatus("rejected")}><X className="h-3.5 w-3.5 mr-1" />Rejeitar</Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 mr-1" />Excluir</Button>
      </div>
    </li>
  );
}
