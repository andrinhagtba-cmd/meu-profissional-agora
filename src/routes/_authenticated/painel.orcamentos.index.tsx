import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, FileText, MapPin, Search, User as UserIcon } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listProDirectQuotes,
  type ProDirectQuote,
} from "@/services/proDirectQuoteService";

export const Route = createFileRoute("/_authenticated/painel/orcamentos/")({
  head: () => ({
    meta: [
      { title: "Pedidos de orçamento" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrcamentosList,
});

const STATUS_LABEL: Record<string, string> = {
  open: "Novo",
  receiving_proposals: "Recebendo propostas",
  professional_selected: "Novo",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  expired: "Expirado",
};

const URGENCY_LABEL: Record<string, string> = {
  hoje: "Hoje",
  "esta-semana": "Esta semana",
  data: "Data marcada",
  "sem-urgencia": "Sem urgência",
};

function OrcamentosList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [onlyUnread, setOnlyUnread] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["pro-direct-quotes"],
    queryFn: listProDirectQuotes,
  });

  const filtered = useMemo(() => {
    let rows = data ?? [];
    if (onlyUnread) rows = rows.filter((r) => !r.pro_viewed_at);
    if (status !== "all") rows = rows.filter((r) => r.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        [r.title, r.client_name, r.service_name, r.city, r.neighborhood]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [data, search, status, onlyUnread]);

  return (
    <SiteLayout>
      <div className="container-page py-10 lg:py-14">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            <Link to="/painel" className="hover:text-primary">
              ← Voltar ao painel
            </Link>
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground lg:text-4xl">
            Pedidos de orçamento
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Solicitações enviadas diretamente para o seu perfil profissional.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, serviço, RA…"
              className="h-10 rounded-xl pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 w-[190px] rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="professional_selected">Novos</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={onlyUnread}
              onChange={(e) => setOnlyUnread(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Apenas não vistos
          </label>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-3xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-4">
            {filtered.map((q) => (
              <QuoteRow key={q.id} q={q} />
            ))}
          </ul>
        )}
      </div>
    </SiteLayout>
  );
}

function QuoteRow({ q }: { q: ProDirectQuote }) {
  const unread = !q.pro_viewed_at;
  const date = new Date(q.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return (
    <li>
      <Link
        to="/painel/orcamentos/$id"
        params={{ id: q.id }}
        className={`block rounded-3xl border p-6 shadow-card transition hover:border-primary/50 ${
          unread ? "border-primary/40 bg-primary/[0.03]" : "border-border bg-card"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {unread && (
                <Badge className="rounded-full bg-orange text-[10px] font-bold uppercase text-orange-foreground hover:bg-orange">
                  Novo
                </Badge>
              )}
              {q.category_name && (
                <Badge className="rounded-full bg-secondary text-[11px] font-semibold text-primary hover:bg-secondary">
                  {q.category_name}
                </Badge>
              )}
              <Badge variant="outline" className="rounded-full text-[11px]">
                {STATUS_LABEL[q.status] ?? q.status}
              </Badge>
            </div>
            <h2 className="mt-2 font-display text-lg font-bold text-foreground">
              {q.title}
            </h2>
            {q.service_name && (
              <p className="text-xs text-muted-foreground">
                Serviço: <span className="font-medium text-foreground">{q.service_name}</span>
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <UserIcon size={13} className="text-primary" />
                {q.client_name ?? "Cliente"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} className="text-primary" />
                {q.neighborhood ? `${q.neighborhood}, ` : ""}
                {q.city}/{q.state}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} className="text-primary" />
                {URGENCY_LABEL[q.urgency] ?? q.urgency} · {date}
              </span>
            </div>
          </div>
          <span className="mt-1 inline-flex h-9 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Ver pedido
          </span>
        </div>
      </Link>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-border bg-card p-10 text-center">
      <FileText className="mx-auto text-primary" />
      <h3 className="mt-3 font-display text-lg font-bold text-foreground">
        Nenhum pedido de orçamento recebido
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Quando um cliente solicitar um orçamento pelo seu perfil público, o pedido
        aparecerá aqui.
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        Mantenha seus serviços, telefone e perfil sempre atualizados para receber mais
        solicitações.
      </p>
    </div>
  );
}
