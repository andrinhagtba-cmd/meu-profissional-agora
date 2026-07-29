import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, Star, Shield } from "lucide-react";
import { listProActivity, type AdminProActivityItem } from "@/services/adminService";

const kindIcon: Record<AdminProActivityItem["kind"], typeof FileText> = {
  quote: FileText, proposal: MessageSquare, review: Star, log: Shield,
};
const kindLabel: Record<AdminProActivityItem["kind"], string> = {
  quote: "Pedido", proposal: "Proposta", review: "Avaliação", log: "Admin",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente", approved: "Aprovada", rejected: "Recusada",
  accepted: "Aceita", declined: "Recusada", sent: "Enviada",
  open: "Aberto", closed: "Encerrado", cancelled: "Cancelado",
  published: "Publicada", draft: "Rascunho", active: "Ativo", expired: "Expirado",
};

export function AdminProActivityPanel({ professionalId }: { professionalId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-pro-activity", professionalId],
    queryFn: () => listProActivity(professionalId),
  });
  const items = data ?? [];

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Sem histórico de atividade.</div>
        ) : (
          <ol className="relative border-l ml-6 py-4">
            {items.map((it) => {
              const Icon = kindIcon[it.kind];
              return (
                <li key={it.id} className="ml-6 mb-4 last:mb-0">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background border">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{it.title}</span>
                    <Badge variant="outline" className="text-[10px] uppercase">{kindLabel[it.kind]}</Badge>
                    {it.status && <Badge variant="secondary" className="text-[10px]">{STATUS_LABEL[it.status] ?? it.status}</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {new Date(it.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                  {it.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{it.description}</p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
