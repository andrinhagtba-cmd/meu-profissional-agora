import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, MapPin, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProposalModal } from "@/components/shared/ProposalModal";
import { quoteRequests } from "@/data/quoteRequests";
import { supabase } from "@/integrations/supabase/client";
import type { QuoteRequest, Urgency } from "@/types";

const urgencyLabel: Record<string, { label: string; className: string }> = {
  hoje: { label: "Urgente · Hoje", className: "bg-orange/10 text-orange" },
  "esta-semana": { label: "Esta semana", className: "bg-secondary text-primary" },
  data: { label: "Data marcada", className: "bg-secondary text-primary" },
  "sem-urgencia": { label: "Sem urgência", className: "bg-muted text-muted-foreground" },
};

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function fetchShowcaseRequests(): Promise<QuoteRequest[]> {
  const { data, error } = await supabase
    .from("showcase_requests")
    .select("*")
    .eq("is_published", true)
    .order("display_order")
    .order("created_at", { ascending: false })
    .limit(6);
  if (error || !data || data.length === 0) return quoteRequests.slice(0, 6);
  return data.map((r) => ({
    id: r.id,
    category: r.category,
    categorySlug: r.category_slug ?? slugify(r.category),
    city: r.city,
    state: r.state,
    date: r.request_date,
    urgency: (r.urgency as Urgency) ?? "esta-semana",
    description: r.description,
    proposals: r.proposals_count ?? 0,
    status: "aberta",
  }));
}

export function RecentRequests() {
  const [selected, setSelected] = useState<QuoteRequest | null>(null);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["home-showcase-requests"],
    queryFn: fetchShowcaseRequests,
  });

  const items = data ?? quoteRequests.slice(0, 6);

  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="pedidos-recentes">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="pedidos-recentes" className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            Pedidos recentes
          </h2>
          <p className="mt-2 text-muted-foreground">
            Clientes esperando propostas de profissionais como você.
          </p>
        </div>
        <Link
          to="/orcamentos"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Ver todos os pedidos
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((req) => {
          const urgency = urgencyLabel[req.urgency] ?? urgencyLabel["esta-semana"];
          return (
            <article
              key={req.id}
              className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-float"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-secondary text-[11px] font-semibold text-primary hover:bg-secondary">
                  {req.category}
                </Badge>
                <Badge className={`rounded-full text-[11px] font-semibold hover:bg-current/10 ${urgency.className}`}>
                  {urgency.label}
                </Badge>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-foreground">{req.description}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} aria-hidden="true" />
                  {req.city}, {req.state}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={12} aria-hidden="true" />
                  {formatDate(req.date)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare size={12} aria-hidden="true" />
                  {req.proposals} propostas
                </span>
              </div>
              <Button
                variant="outline"
                className="mt-4 h-11 rounded-xl border-border font-semibold text-primary hover:bg-secondary"
                onClick={() => {
                  setSelected(req);
                  setOpen(true);
                }}
              >
                Enviar proposta
              </Button>
            </article>
          );
        })}
      </div>

      <ProposalModal request={selected} open={open} onOpenChange={setOpen} />
    </section>
  );
}
