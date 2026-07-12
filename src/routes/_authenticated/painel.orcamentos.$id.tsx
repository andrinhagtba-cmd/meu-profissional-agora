import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  User as UserIcon,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getProDirectQuote,
  markProQuoteViewed,
} from "@/services/proDirectQuoteService";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/painel/orcamentos/$id")({
  head: () => ({
    meta: [
      { title: "Pedido de orçamento" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrcamentoDetail,
});

const URGENCY_LABEL: Record<string, string> = {
  hoje: "Hoje — urgente",
  "esta-semana": "Esta semana",
  data: "Data marcada",
  "sem-urgencia": "Sem urgência",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Novo",
  receiving_proposals: "Recebendo propostas",
  professional_selected: "Novo",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  expired: "Expirado",
};

function OrcamentoDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["pro-direct-quote", id],
    queryFn: () => getProDirectQuote(id),
  });

  useEffect(() => {
    if (data?.id) {
      markProQuoteViewed(id).then(() => {
        qc.invalidateQueries({ queryKey: ["pro-direct-quotes"] });
        qc.invalidateQueries({ queryKey: ["pro-unread-direct-quotes"] });
        qc.invalidateQueries({ queryKey: ["painel"] });
        qc.invalidateQueries({ queryKey: ["notifications"] });
      });
    }
  }, [data?.id, id, qc]);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container-page py-10">
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </SiteLayout>
    );
  }

  if (error || !data) {
    return (
      <SiteLayout>
        <div className="container-page py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Pedido não encontrado
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Você não tem permissão para visualizar este pedido, ou ele foi removido.
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link to="/painel/orcamentos">Voltar para os pedidos</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const q = data;
  const whatsUrl = q.client_phone
    ? buildWhatsAppUrl(
        q.client_phone,
        `Olá, ${q.client_name ?? ""}. Recebi seu pedido de orçamento para ${
          q.service_name ?? q.title
        } pelo Guia DF na Mídia.`,
      )
    : null;

  const created = new Date(q.created_at).toLocaleString("pt-BR");

  return (
    <SiteLayout>
      <div className="container-page py-10 lg:py-14">
        <p className="text-sm text-muted-foreground">
          <Link to="/painel/orcamentos" className="inline-flex items-center gap-1 hover:text-primary">
            <ArrowLeft size={14} /> Todos os pedidos
          </Link>
        </p>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {q.category_name && (
                <Badge className="rounded-full bg-secondary text-[11px] font-semibold text-primary hover:bg-secondary">
                  {q.category_name}
                </Badge>
              )}
              <Badge variant="outline" className="rounded-full text-[11px]">
                {STATUS_LABEL[q.status] ?? q.status}
              </Badge>
            </div>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-foreground lg:text-3xl">
              {q.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              Protocolo OR-{q.id.slice(0, 6).toUpperCase()} · Recebido em {created}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Left: Client + Actions */}
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-base font-bold text-foreground">Cliente</h2>
              <div className="mt-3 space-y-2 text-sm">
                <p className="inline-flex items-center gap-2">
                  <UserIcon size={14} className="text-primary" />
                  <span className="font-medium">{q.client_name ?? "—"}</span>
                </p>
                {q.client_phone && (
                  <p className="inline-flex items-center gap-2">
                    <Phone size={14} className="text-primary" />
                    <a
                      href={`tel:${q.client_phone}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {q.client_phone}
                    </a>
                  </p>
                )}
                {q.client_email && (
                  <p className="inline-flex items-center gap-2">
                    <Mail size={14} className="text-primary" />
                    <a
                      href={`mailto:${q.client_email}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {q.client_email}
                    </a>
                  </p>
                )}
                {q.client_city && (
                  <p className="inline-flex items-center gap-2 text-muted-foreground">
                    <MapPin size={14} className="text-primary" />
                    {q.client_city}
                  </p>
                )}
              </div>

              <div className="mt-5 space-y-2">
                {whatsUrl && (
                  <Button
                    asChild
                    className="w-full rounded-xl bg-[#25D366] font-semibold text-white hover:bg-[#20b858]"
                  >
                    <a href={whatsUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle size={16} /> Chamar no WhatsApp
                    </a>
                  </Button>
                )}
                {q.client_phone && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-xl"
                  >
                    <a href={`tel:${q.client_phone}`}>
                      <Phone size={16} /> Ligar
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-base font-bold text-foreground">
                Solicitação
              </h2>
              {q.service_name && (
                <p className="mt-3 text-sm">
                  <span className="text-muted-foreground">Serviço:</span>{" "}
                  <span className="font-medium text-foreground">{q.service_name}</span>
                </p>
              )}
              {q.description && (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                  {q.description}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard
                icon={<MapPin size={16} />}
                title="Localização"
                lines={[
                  q.neighborhood ? `${q.neighborhood}` : null,
                  `${q.city}/${q.state}`,
                ].filter(Boolean) as string[]}
              />
              <InfoCard
                icon={<Clock size={16} />}
                title="Urgência"
                lines={[URGENCY_LABEL[q.urgency] ?? q.urgency]}
              />
              {q.preferred_date && (
                <InfoCard
                  icon={<Calendar size={16} />}
                  title="Data desejada"
                  lines={[new Date(q.preferred_date).toLocaleDateString("pt-BR")]}
                />
              )}
              <InfoCard
                icon={<UserIcon size={16} />}
                title="Tipo de atendimento"
                lines={[q.service_type]}
              />
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function InfoCard({
  icon,
  title,
  lines,
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </p>
      <div className="mt-1 space-y-0.5 text-sm font-medium text-foreground">
        {lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
    </div>
  );
}
