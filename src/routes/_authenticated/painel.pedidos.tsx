import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, MessageSquare } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { listMyQuotes, type MyQuote } from "@/services/clientService";

export const Route = createFileRoute("/_authenticated/painel/pedidos")({
  head: () => ({
    meta: [
      { title: "Meus pedidos — ProConecta" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MeusPedidos,
});

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

const URGENCY_LABEL: Record<string, string> = {
  hoje: "Hoje",
  "esta-semana": "Esta semana",
  data: "Data específica",
  "sem-urgencia": "Sem urgência",
};

function MeusPedidos() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-quotes", user?.id],
    enabled: !!user?.id,
    queryFn: () => listMyQuotes(user!.id),
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
              Meus pedidos
            </h1>
          </div>
          <Button asChild className="h-11 rounded-xl bg-orange px-5 font-semibold text-orange-foreground hover:bg-orange/90">
            <Link to="/pedir-orcamento" search={{} as never}>Novo pedido</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-3xl" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center">
            <MessageSquare className="mx-auto text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">
              Você ainda não fez nenhum pedido. Comece agora e receba até 5 orçamentos.
            </p>
            <Button asChild className="mt-4 h-11 rounded-xl px-5 font-semibold">
              <Link to="/pedir-orcamento" search={{} as never}>Pedir orçamento</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {data.map((q) => (
              <QuoteRow key={q.id} q={q} />
            ))}
          </ul>
        )}
      </div>
    </SiteLayout>
  );
}

function QuoteRow({ q }: { q: MyQuote }) {
  const date = new Date(q.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return (
    <li className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
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
          <h2 className="mt-2 font-display text-lg font-bold text-foreground">{q.title}</h2>
          {q.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{q.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} className="text-primary" />
              {q.neighborhood ? `${q.neighborhood}, ` : ""}
              {q.city}/{q.state}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} className="text-primary" />
              {URGENCY_LABEL[q.urgency] ?? q.urgency} · enviado em {date}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}
