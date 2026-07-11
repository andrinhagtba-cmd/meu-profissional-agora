import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  getQuoteHistory,
  updateQuoteStatus,
  type QuoteHistoryEntry,
} from "@/services/clientService";

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

const TRACK_STEPS: { key: string; label: string }[] = [
  { key: "open", label: "Aberto" },
  { key: "professional_selected", label: "Profissional selecionado" },
  { key: "in_progress", label: "Em andamento" },
  { key: "completed", label: "Concluído" },
];

function stepIndex(status: string) {
  if (status === "cancelled" || status === "expired") return -1;
  if (status === "receiving_proposals" || status === "open" || status === "draft") return 0;
  const i = TRACK_STEPS.findIndex((s) => s.key === status);
  return i < 0 ? 0 : i;
}

export function TrackingSection({
  quote,
  viewerRole,
}: {
  quote: { id: string; status: string; title: string };
  viewerRole: "client" | "professional";
}) {
  const qc = useQueryClient();
  const history = useQuery({
    queryKey: ["quote-history", quote.id],
    queryFn: () => getQuoteHistory(quote.id),
  });
  const [note, setNote] = useState("");

  const mutate = useMutation({
    mutationFn: (status: "in_progress" | "completed" | "cancelled") =>
      updateQuoteStatus(quote.id, status, note.trim() || undefined),
    onSuccess: () => {
      toast.success("Status atualizado.");
      setNote("");
      qc.invalidateQueries({ queryKey: ["quote", quote.id] });
      qc.invalidateQueries({ queryKey: ["quote-history", quote.id] });
      qc.invalidateQueries({ queryKey: ["my-quotes"] });
      qc.invalidateQueries({ queryKey: ["pro-jobs"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao atualizar"),
  });

  const idx = stepIndex(quote.status);
  const isTerminal = ["completed", "cancelled", "expired"].includes(quote.status);
  const canStart = quote.status === "professional_selected";
  const canComplete = quote.status === "in_progress" || quote.status === "professional_selected";
  const canCancel = viewerRole === "client" && !isTerminal;

  return (
    <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-foreground">Acompanhamento</h2>
        <Badge variant="outline" className="rounded-full text-[11px]">
          {STATUS_LABEL[quote.status] ?? quote.status}
        </Badge>
      </div>

      <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TRACK_STEPS.map((s, i) => {
          const done = idx >= i && !isTerminal;
          const active = idx === i && !isTerminal;
          const cancelled = quote.status === "cancelled";
          return (
            <li
              key={s.key}
              className={`rounded-2xl border p-3 text-xs ${
                cancelled
                  ? "border-red-200 bg-red-50 text-red-700"
                  : active
                    ? "border-primary bg-primary/5 text-primary"
                    : done
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-border bg-muted/40 text-muted-foreground"
              }`}
            >
              <div className="font-semibold">Etapa {i + 1}</div>
              <div className="mt-0.5">{s.label}</div>
            </li>
          );
        })}
      </ol>

      {!isTerminal && (
        <div className="mt-5 space-y-3">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Adicione uma observação (opcional)"
            className="min-h-[72px] rounded-2xl"
          />
          <div className="flex flex-wrap gap-2">
            {canStart && (
              <Button
                onClick={() => mutate.mutate("in_progress")}
                disabled={mutate.isPending}
                className="rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Iniciar serviço
              </Button>
            )}
            {canComplete && (
              <Button
                onClick={() => mutate.mutate("completed")}
                disabled={mutate.isPending}
                className="rounded-xl bg-orange font-semibold text-orange-foreground hover:bg-orange/90"
              >
                Marcar como concluído
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                onClick={() => mutate.mutate("cancelled")}
                disabled={mutate.isPending}
                className="rounded-xl"
              >
                Cancelar pedido
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground">Histórico</h3>
        {history.isLoading ? (
          <Skeleton className="mt-3 h-24 rounded-2xl" />
        ) : (
          <ol className="mt-3 space-y-3 border-l border-border pl-4">
            {(history.data ?? []).slice().reverse().map((h: QuoteHistoryEntry) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/10" />
                <div className="text-xs text-muted-foreground">
                  {new Date(h.created_at).toLocaleString("pt-BR")}
                  {h.actor_role ? ` · ${h.actor_role === "client" ? "Cliente" : h.actor_role === "professional" ? "Profissional" : h.actor_role === "admin" ? "Admin" : "Sistema"}` : ""}
                </div>
                <div className="text-sm font-medium text-foreground">
                  {h.from_status ? `${STATUS_LABEL[h.from_status] ?? h.from_status} → ` : ""}
                  {STATUS_LABEL[h.to_status] ?? h.to_status}
                </div>
                {h.note && <div className="mt-0.5 text-sm text-muted-foreground">{h.note}</div>}
              </li>
            ))}
            {(history.data ?? []).length === 0 && (
              <li className="text-sm text-muted-foreground">Sem eventos ainda.</li>
            )}
          </ol>
        )}
      </div>
    </section>
  );
}
