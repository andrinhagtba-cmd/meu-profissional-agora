import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, LockKeyhole, MapPin, MessageSquare, Plus } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { quoteRequests } from "@/data/quoteRequests";

export const Route = createFileRoute("/orcamentos")({
  head: () => ({
    meta: [
      { title: "Pedidos de orçamento — ProConecta" },
      { name: "description", content: "Veja pedidos recentes e acesse seu painel para responder leads e acompanhar propostas com segurança." },
      { property: "og:title", content: "Pedidos de orçamento — ProConecta" },
      { property: "og:description", content: "Pedidos recentes de clientes esperando profissionais qualificados na ProConecta." },
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

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function OrcamentosPage() {
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
              Esta vitrine mostra exemplos recentes. Para responder leads reais, entre no painel profissional e envie propostas com histórico e mensagens.
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
          {quoteRequests.map((req) => (
            <article key={req.id} className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-float">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-secondary text-[11px] font-semibold text-primary hover:bg-secondary">{req.category}</Badge>
                <Badge className="rounded-full bg-orange/10 text-[11px] font-semibold text-orange hover:bg-orange/10">{urgencyLabel[req.urgency]}</Badge>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground">{req.description}</p>
              <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin size={12} /> {req.city}, {req.state}</span>
                <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {formatDate(req.date)}</span>
                <span className="inline-flex items-center gap-1"><MessageSquare size={12} /> {req.proposals} propostas recebidas</span>
              </div>
              <Button asChild variant="outline" className="mt-5 h-11 rounded-xl border-border font-semibold text-primary hover:bg-secondary">
                <Link to="/painel/leads">Responder pelo painel</Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}