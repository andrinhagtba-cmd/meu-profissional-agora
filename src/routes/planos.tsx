import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Crown, Sparkles, Star, Zap, TrendingUp, Shield, Rocket, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos Premium para Profissionais | Guia DF na Mídia" },
      {
        name: "description",
        content:
          "Escolha o plano ideal para receber mais leads qualificados no DF, destacar seu perfil e crescer sua base de clientes.",
      },
      { property: "og:title", content: "Planos Premium para Profissionais" },
      {
        property: "og:description",
        content: "Compare planos, benefícios e limites de leads para profissionais do Distrito Federal.",
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

function getWhatsAppLink(planName: string) {
  const phone = "5561998662261";
  const message = encodeURIComponent(
    `Olá! Vi o plano ${planName} no Guia DF na Mídia e quero começar agora. Pode me passar mais informações?`
  );
  return `https://wa.me/${phone}?text=${message}`;
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
      {/* HERO PREMIUM */}
      <section className="relative overflow-hidden bg-[#0A0F1E] text-white">
        {/* Malha de gradientes */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-primary/40 blur-[120px]" />
          <div className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-orange/30 blur-[120px]" />
          <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />
        </div>
        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="container-page relative py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              <Sparkles size={12} className="text-orange" /> Planos Premium para Profissionais
            </div>
            <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              Cresça no{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-[#5B9BFF] to-orange bg-clip-text text-transparent">
                  Distrito Federal
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 9C60 3 150 3 298 9"
                    stroke="url(#underline-grad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="underline-grad" x1="0" y1="0" x2="300" y2="0">
                      <stop stopColor="#0759F8" />
                      <stop offset="1" stopColor="#FF642E" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>
            <p className="mt-6 text-base text-white/70 sm:text-lg">
              Receba leads qualificados, destaque seu perfil e feche mais serviços. Sem taxa por serviço, cancele quando quiser.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                { icon: Shield, label: "Sem taxa de adesão" },
                { icon: Rocket, label: "Ativação em 24h" },
                { icon: TrendingUp, label: "Mais visibilidade" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-md"
                >
                  <Icon size={14} className="text-orange" /> {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Curva de transição */}
        <svg
          className="absolute bottom-0 left-0 w-full text-background"
          viewBox="0 0 1440 60"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0 60L1440 60L1440 20C1080 50 720 0 360 20L0 40Z" />
        </svg>
      </section>

      {/* PLANOS */}
      <section className="relative -mt-8 pb-16">
        <div className="container-page pt-8 lg:pt-12">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[600px] rounded-3xl" />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-card px-6 py-20 text-center">
              <Crown size={48} className="text-muted-foreground/40" />
              <h3 className="mt-5 font-display text-xl font-bold text-foreground">Planos em breve</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Estamos finalizando nossas opções de planos. Enquanto isso, você pode se cadastrar como profissional gratuitamente.
              </p>
              <Button asChild className="mt-6 rounded-xl bg-primary shadow-lg shadow-primary/25 hover:bg-primary/90">
                <Link to="/cadastro/profissional">Cadastrar-se grátis</Link>
              </Button>
            </div>
          ) : (
            <div
              className={`mx-auto grid max-w-6xl items-stretch gap-6 lg:gap-8 ${
                data.length === 1
                  ? "md:grid-cols-1 max-w-md"
                  : data.length === 2
                  ? "md:grid-cols-2 max-w-4xl"
                  : "md:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {data.map((plan, idx) => {
                const highlight = plan.featured_profile || idx === Math.floor(data.length / 2);
                return (
                  <article
                    key={plan.id}
                    className={`group relative flex flex-col rounded-3xl transition-all duration-500 ${
                      highlight
                        ? "lg:-my-4 lg:scale-105"
                        : ""
                    }`}
                  >
                    {/* Aura gradient para o destaque */}
                    {highlight && (
                      <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-br from-primary via-[#5B9BFF] to-orange opacity-100 blur-[2px]" />
                    )}

                    <div
                      className={`relative flex h-full flex-col overflow-hidden rounded-3xl p-8 transition-all duration-500 ${
                        highlight
                          ? "bg-gradient-to-br from-[#0A1330] via-[#0B1D4D] to-[#0A1330] text-white shadow-[0_30px_80px_-20px_rgba(7,89,248,0.5)]"
                          : "border border-border/60 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_50px_-15px_rgba(15,23,42,0.15)]"
                      }`}
                    >
                      {/* Padrão decorativo interno para o premium */}
                      {highlight && (
                        <>
                          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-orange/20 blur-3xl" />
                          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
                          <div
                            className="pointer-events-none absolute inset-0 opacity-[0.08]"
                            style={{
                              backgroundImage:
                                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                              backgroundSize: "24px 24px",
                            }}
                          />
                        </>
                      )}

                      {/* Badge */}
                      {highlight && (
                        <div className="relative mb-6 -mx-2 flex justify-center">
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange to-[#FF8A5B] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange/40">
                            <Crown size={11} className="fill-white" /> Mais Escolhido
                          </div>
                        </div>
                      )}

                      <header className="relative">
                        <span
                          className={`grid h-14 w-14 place-items-center rounded-2xl transition-transform group-hover:scale-110 ${
                            highlight
                              ? "bg-white/10 text-white ring-1 ring-white/20 backdrop-blur"
                              : "bg-gradient-to-br from-primary/10 to-primary/5 text-primary"
                          }`}
                        >
                          {highlight ? <Crown size={22} /> : idx === 0 ? <Zap size={22} /> : <Rocket size={22} />}
                        </span>
                        <h3 className={`mt-5 font-display text-2xl font-extrabold ${highlight ? "text-white" : "text-foreground"}`}>
                          {plan.name}
                        </h3>
                        {plan.description && (
                          <p className={`mt-2 text-sm leading-relaxed ${highlight ? "text-white/70" : "text-muted-foreground"}`}>
                            {plan.description}
                          </p>
                        )}
                      </header>

                      <div className={`relative my-7 border-y py-6 ${highlight ? "border-white/10" : "border-border"}`}>
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`font-display text-5xl font-black tracking-tight lg:text-6xl ${
                              highlight ? "text-white" : "text-foreground"
                            }`}
                          >
                            {formatBRL(plan.price)}
                          </span>
                          <span className={`text-sm font-medium ${highlight ? "text-white/60" : "text-muted-foreground"}`}>
                            {periodLabel(plan.billing_period)}
                          </span>
                        </div>
                        <div
                          className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            highlight
                              ? "bg-white/10 text-white ring-1 ring-white/15"
                              : "bg-primary/8 text-primary ring-1 ring-primary/15"
                          }`}
                        >
                          <TrendingUp size={12} />
                          {plan.lead_limit == null
                            ? "Leads ilimitados por mês"
                            : `Até ${plan.lead_limit} leads/mês`}
                        </div>
                      </div>

                      <ul className="relative flex-1 space-y-3.5">
                        {(plan.features ?? []).map((f) => (
                          <li key={f} className="flex items-start gap-3 text-sm">
                            <span
                              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                                highlight
                                  ? "bg-gradient-to-br from-orange to-[#FF8A5B] text-white shadow-md shadow-orange/30"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              <Check size={12} strokeWidth={3} />
                            </span>
                            <span className={highlight ? "text-white/90" : "text-foreground"}>{f}</span>
                          </li>
                        ))}
                        {plan.featured_profile && (
                          <li className="flex items-start gap-3 text-sm">
                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-orange to-[#FF8A5B] text-white shadow-md shadow-orange/30">
                              <Star size={12} strokeWidth={3} className="fill-white" />
                            </span>
                            <span className={`font-semibold ${highlight ? "text-white" : "text-foreground"}`}>
                              Perfil em destaque nas buscas
                            </span>
                          </li>
                        )}
                      </ul>

                      <Button
                        asChild
                        className={`relative mt-8 h-14 w-full rounded-2xl text-sm font-bold transition-all ${
                          highlight
                            ? "bg-gradient-to-r from-orange to-[#FF8A5B] text-white shadow-xl shadow-orange/40 hover:shadow-2xl hover:shadow-orange/60 hover:brightness-110"
                            : "bg-foreground text-background hover:bg-foreground/90"
                        }`}
                      >
                        <a
                          href={getWhatsAppLink(plan.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/btn inline-flex items-center justify-center gap-2"
                        >
                          Começar agora
                          <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
                        </a>
                      </Button>

                      {highlight && (
                        <p className="relative mt-3 text-center text-[11px] text-white/50">
                          🔒 Ativação imediata via WhatsApp
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Selos de confiança */}
          <div className="mx-auto mt-20 max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Shield, title: "Pagamento seguro", desc: "Pix, cartão ou boleto" },
                { icon: Rocket, title: "Sem fidelidade", desc: "Cancele quando quiser" },
                { icon: Sparkles, title: "Suporte humano", desc: "Time dedicado no DF" },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-center gap-4 rounded-2xl border border-border/60 bg-white p-5 shadow-sm"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/10 to-orange/10 text-primary">
                    <Icon size={20} />
                  </span>
                  <div>
                    <div className="font-display text-sm font-bold text-foreground">{title}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="mx-auto mt-20 max-w-3xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles size={12} /> Dúvidas frequentes
              </div>
              <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
                Tudo o que você precisa saber
              </h2>
            </div>
            <div className="mt-10 space-y-3">
              {FAQ.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-2xl border border-border/70 bg-white p-5 transition open:border-primary/30 open:shadow-lg open:shadow-primary/5"
                >
                  <summary className="cursor-pointer list-none font-display font-bold text-foreground marker:hidden">
                    <div className="flex items-center justify-between gap-4">
                      <span>{f.q}</span>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/10 to-orange/10 text-primary transition group-open:rotate-45 group-open:from-primary group-open:to-orange group-open:text-white">
                        +
                      </span>
                    </div>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* CTA final */}
          <div className="mx-auto mt-20 max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1330] via-[#0B1D4D] to-[#0A1330] px-8 py-12 text-center text-white sm:px-12 sm:py-16">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/40 blur-3xl" />
              <div className="relative">
                <h3 className="font-display text-3xl font-extrabold sm:text-4xl">
                  Ainda com dúvidas sobre qual plano escolher?
                </h3>
                <p className="mx-auto mt-4 max-w-xl text-white/70">
                  Fale com nosso time no WhatsApp. Ajudamos você a escolher o plano ideal para o seu negócio.
                </p>
                <Button
                  asChild
                  className="mt-8 h-14 rounded-2xl bg-gradient-to-r from-orange to-[#FF8A5B] px-8 text-sm font-bold text-white shadow-xl shadow-orange/40 hover:brightness-110"
                >
                  <a
                    href={`https://wa.me/5561998662261?text=${encodeURIComponent(
                      "Olá! Gostaria de tirar dúvidas sobre os planos do Guia DF na Mídia."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Falar com um consultor
                    <ArrowRight size={16} className="ml-2" />
                  </a>
                </Button>
              </div>
            </div>
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
