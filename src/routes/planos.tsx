import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Crown, Sparkles, Star, Zap } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos para Profissionais" },
      {
        name: "description",
        content:
          "Escolha o plano ideal para receber mais leads qualificados, destacar seu perfil e crescer com a plataforma.",
      },
      { property: "og:title", content: "Planos para Profissionais" },
      {
        property: "og:description",
        content:
          "Compare planos, benefícios e limites de leads para profissionais na plataforma.",
      },
    ],
  }),
  component: PlansPage,
});

type PublicPlan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: string;
  lead_limit: number | null;
  featured_profile: boolean;
  features: string[] | null;
};

async function listPublicPlans(): Promise<PublicPlan[]> {
  const { data, error } = await supabase
    .from("plans")
    .select("id, name, description, price, billing_period, lead_limit, featured_profile, features")
    .eq("active", true)
    .order("price", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    features: Array.isArray(r.features) ? (r.features as string[]) : null,
  })) as PublicPlan[];
}

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

function periodLabel(p: string) {
  const map: Record<string, string> = {
    monthly: "/mês",
    yearly: "/ano",
    quarterly: "/trimestre",
    weekly: "/semana",
  };
  return map[p] ?? `/${p}`;
}

function PlansPage() {
  const { data, isLoading } = useQuery({ queryKey: ["public-plans"], queryFn: listPublicPlans });

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-orange/5">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-orange/10 blur-3xl" />
        <div className="container-page relative py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-primary shadow-sm ring-1 ring-primary/15">
              <Sparkles size={12} /> Planos para profissionais
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Cresça com a{" "}
              <span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">
                plataforma
              </span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Receba leads qualificados perto de você, destaque seu perfil e feche mais serviços. Cancele quando quiser.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-primary" /> Sem taxa de adesão
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-primary" /> Cancele quando quiser
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-primary" /> Suporte dedicado
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section className="container-page py-12 lg:py-16">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[520px] rounded-3xl" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-card px-6 py-20 text-center">
            <Crown size={48} className="text-muted-foreground/40" />
            <h3 className="mt-5 font-display text-xl font-bold text-foreground">
              Planos em breve
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Estamos finalizando nossas opções de planos. Enquanto isso, você pode se cadastrar como profissional gratuitamente.
            </p>
            <Button asChild className="mt-6 rounded-xl bg-primary shadow-lg shadow-primary/25 hover:bg-primary/90">
              <Link to="/cadastro/profissional">Cadastrar-se grátis</Link>
            </Button>
          </div>
        ) : (
          <div
            className={`mx-auto grid max-w-6xl gap-6 ${
              data.length === 1
                ? "md:grid-cols-1"
                : data.length === 2
                ? "md:grid-cols-2"
                : "md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {data.map((plan, idx) => {
              const highlight = plan.featured_profile || idx === Math.floor(data.length / 2);
              return (
                <article
                  key={plan.id}
                  className={`relative flex flex-col overflow-hidden rounded-3xl p-8 shadow-[0_1px_2px_oklch(0.51_0.245_262/4%)] transition hover:-translate-y-1 hover:shadow-2xl ${
                    highlight
                      ? "border-2 border-primary bg-gradient-to-br from-primary/[0.03] via-white to-orange/[0.03]"
                      : "border border-border bg-card"
                  }`}
                >
                  {highlight && (
                    <div className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-orange px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
                      <Star size={10} className="fill-white" /> Mais popular
                    </div>
                  )}

                  <header>
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-2xl ${
                        highlight
                          ? "bg-gradient-to-br from-primary to-orange text-white shadow-lg shadow-primary/25"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {highlight ? <Crown size={20} /> : <Zap size={20} />}
                    </span>
                    <h3 className="mt-4 font-display text-2xl font-extrabold text-foreground">{plan.name}</h3>
                    {plan.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                    )}
                  </header>

                  <div className="my-6 border-y border-border py-6">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-5xl font-extrabold tracking-tight text-foreground">
                        {formatBRL(plan.price)}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {periodLabel(plan.billing_period)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {plan.lead_limit == null
                        ? "Leads ilimitados por mês"
                        : `Até ${plan.lead_limit} leads por mês`}
                    </div>
                  </div>

                  <ul className="flex-1 space-y-3">
                    {(plan.features ?? []).map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                        <Check
                          size={16}
                          className={`mt-0.5 shrink-0 ${highlight ? "text-primary" : "text-emerald-600"}`}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.featured_profile && (
                      <li className="flex items-start gap-2.5 text-sm font-semibold text-foreground">
                        <Star size={16} className="mt-0.5 shrink-0 fill-orange text-orange" />
                        <span>Perfil em destaque nas buscas</span>
                      </li>
                    )}
                  </ul>

                  <Button
                    asChild
                    className={`mt-8 h-12 w-full rounded-xl text-sm font-bold ${
                      highlight
                        ? "bg-gradient-to-r from-primary to-orange text-white shadow-lg shadow-primary/30 hover:opacity-95"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    <a
                      href={getWhatsAppLink(plan.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Começar agora
                    </a>
                  </Button>
                </article>
              );
            })}
          </div>
        )}

        {/* FAQ */}
        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-center font-display text-3xl font-extrabold text-foreground">
            Perguntas frequentes
          </h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-border bg-card p-5 open:shadow-md"
              >
                <summary className="cursor-pointer list-none font-display font-bold text-foreground marker:hidden">
                  <div className="flex items-center justify-between">
                    <span>{f.q}</span>
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary transition group-open:rotate-45">
                      +
                    </span>
                  </div>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

const FAQ = [
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. A assinatura pode ser cancelada a qualquer momento pelo seu painel, sem multa. Você mantém o acesso até o final do período pago.",
  },
  {
    q: "Como funciona o limite de leads?",
    a: "Cada plano tem um número máximo de leads por mês. Ao atingir o limite, você continua com o perfil ativo e pode fazer upgrade para receber mais.",
  },
  {
    q: "Perfil em destaque aparece onde?",
    a: "Nos topos das listagens de busca e categoria, com selo especial de destaque — aumentando drasticamente sua visibilidade.",
  },
  {
    q: "Preciso pagar taxa por serviço fechado?",
    a: "Não. Você paga apenas a mensalidade do plano. O que você combinar com o cliente é integralmente seu.",
  },
];
