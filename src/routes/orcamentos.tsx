import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, LockKeyhole, MapPin, MessageSquare, Plus } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/orcamentos")({
  head: () => ({
    meta: [
      { title: "Pedidos de orçamento" },
      { name: "description", content: "Veja pedidos recentes e acesse seu painel para responder leads e acompanhar propostas com segurança." },
      { property: "og:title", content: "Pedidos de orçamento" },
      { property: "og:description", content: "Pedidos recentes de clientes esperando profissionais qualificados na plataforma." },
    ],
  }),
  component: OrcamentosPage,
});

const urgencyLabel: Record<string, string> = {
  hoje: "Urgente · hoje",
  "esta-semana": "Esta semana",
  data: "Data marcada",
  "sem-urgencia": "Sem urgência",
};

type PublicQuoteRequest = {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  state: string | null;
  urgency: string | null;
  service_type: string | null;
  status: string;
  created_at: string;
  category_name: string | null;
  category_slug: string | null;
};

async function listVisibleQuoteRequests(): Promise<PublicQuoteRequest[]> {
  const { data, error } = await (supabase as unknown as {
    rpc: (name: string, args: { _limit: number }) => Promise<{ data: PublicQuoteRequest[] | null; error: Error | null }>;
  }).rpc("list_public_quote_requests", { _limit: 60 });
  if (error) throw error;
  return data ?? [];
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function OrcamentosPage() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["public-orcamentos"],
    queryFn: listVisibleQuoteRequests,
  });

  return (
    <SiteLayout>
      <div className="container-page py-12 lg:py-16">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary via-primary to-[#0a4bd8] p-8 text-primary-foreground shadow-card lg:p-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <LockKeyhole size={13} /> Leads reais ficam protegidos no painel
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight lg:text-5xl">Pedidos de orçamento</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 lg:text-base">
              Esta vitrine mostra pedidos reais recentes. Para responder leads com segurança, entre no painel profissional e envie propostas com histórico e mensagens.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="h-11 rounded-xl bg-orange px-5 font-semibold text-orange-foreground hover:bg-orange/90">
                <Link to="/painel/leads"><MessageSquare size={16} /> Ver leads no painel</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl border-white/30 bg-white/10 px-5 font-semibold text-white hover:bg-white/20 hover:text-white">
                <Link to="/pedir-orcamento" search={{} as never}><Plus size={16} /> Pedir orçamento</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-56 rounded-3xl" />)}

          {!isLoading && data.map((req) => (
            <article key={req.id} className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-float">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-secondary text-[11px] font-semibold text-primary hover:bg-secondary">{req.category_name ?? req.service_type ?? "Serviço"}</Badge>
                <Badge className="rounded-full bg-orange/10 text-[11px] font-semibold text-orange hover:bg-orange/10">{urgencyLabel[req.urgency ?? ""] ?? "Pedido aberto"}</Badge>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground">{req.description || req.title}</p>
              <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin size={12} /> {req.city ?? "Cidade"}, {req.state ?? "UF"}</span>
                <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {formatDate(req.created_at)}</span>
                <span className="inline-flex items-center gap-1"><MessageSquare size={12} /> Recebendo propostas</span>
              </div>
              <Button asChild variant="outline" className="mt-5 h-11 rounded-xl border-border font-semibold text-primary hover:bg-secondary">
                <Link to="/painel/leads">Responder pelo painel</Link>
              </Button>
            </article>
          ))}

          {!isLoading && data.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-card">
              <h2 className="font-display text-2xl font-extrabold text-foreground">Nenhum pedido visível agora</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                Se você acabou de criar um pedido, entre com a mesma conta usada no cadastro ou acompanhe pelo painel do cliente.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button asChild className="rounded-xl"><Link to="/painel/pedidos">Ver meus pedidos</Link></Button>
                <Button asChild variant="outline" className="rounded-xl"><Link to="/pedir-orcamento" search={{} as never}>Criar novo pedido</Link></Button>
              </div>
            </div>
          )}

          {isError && (
            <div className="col-span-full rounded-3xl border border-orange/20 bg-orange/5 p-6 text-sm font-semibold text-orange">
              Não foi possível carregar os pedidos agora. Tente novamente em instantes.
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}