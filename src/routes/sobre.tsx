import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Star, Users } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Como funciona" },
      {
        name: "description",
        content: "Entenda como a ${BRAND_PLACEHOLDER} conecta clientes a profissionais avaliados com segurança, orçamentos e mensagens em um só lugar.",
      },
      { property: "og:title", content: "Como funciona" },
      {
        property: "og:description",
        content: "Clientes pedem orçamentos, profissionais enviam propostas e tudo acontece com avaliações, chat e histórico.",
      },
    ],
  }),
  component: SobrePage,
});

const steps = [
  "Descreva o serviço e a região de atendimento.",
  "Receba propostas de profissionais qualificados.",
  "Compare histórico, avaliações, preço e prazo.",
  "Escolha o profissional, converse e acompanhe tudo no painel.",
];

function SobrePage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-orange/5">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-bold text-primary">
              <Sparkles size={13} /> Marketplace profissional brasileiro
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-foreground lg:text-6xl">
              Contratação de serviços com clareza do pedido à avaliação.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground lg:text-lg">
              A ${BRAND_PLACEHOLDER} organiza orçamentos, propostas, mensagens e reputação para clientes e profissionais trabalharem com mais confiança.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="h-12 rounded-xl bg-orange px-6 font-semibold text-orange-foreground hover:bg-orange/90">
                <Link to="/pedir-orcamento" search={{} as never}>Pedir orçamento <ArrowRight size={16} /></Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-xl border-border px-6 font-semibold">
                <Link to="/cadastro/profissional">Criar perfil profissional</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Perfis", value: "20+", icon: Users },
                { label: "Avaliações", value: "4.8★", icon: Star },
                { label: "Verificação", value: "Ativa", icon: ShieldCheck },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl bg-secondary/70 p-4">
                  <Icon className="text-primary" size={20} />
                  <p className="mt-3 font-display text-2xl font-extrabold text-foreground">{value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <ol className="mt-6 space-y-3">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-2xl border border-border bg-background p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</span>
                  <span className="text-sm font-medium text-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="container-page py-14">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {["RLS e dados protegidos", "Favoritos sincronizados", "Chat após proposta aceita", "Painel para cliente e profissional"].map((item) => (
            <div key={item} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <CheckCircle2 className="text-primary" size={20} />
              <p className="mt-3 text-sm font-bold text-foreground">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}