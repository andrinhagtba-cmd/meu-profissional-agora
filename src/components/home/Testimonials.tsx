import { Quote, Send } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/shared/RatingStars";
import { ProAvatar } from "@/components/shared/ProAvatar";
import { supabase } from "@/integrations/supabase/client";

type HomeTestimonial = {
  id: string;
  name: string;
  city: string;
  initials: string;
  color: string;
  text: string;
  rating: number;
  service: string;
};

const COLORS = ["bg-primary", "bg-orange", "bg-success"];

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const fallbackTestimonials: HomeTestimonial[] = [
  {
    id: "f1",
    name: "Renata Silveira",
    city: "Asa Norte, Brasília/DF",
    initials: "RS",
    color: "bg-primary",
    text: "Encontrei uma diarista incrível em menos de uma hora. As avaliações me deram total segurança para contratar.",
    rating: 5,
    service: "Diarista",
  },
  {
    id: "f2",
    name: "Eduardo Prado",
    city: "Taguatinga, Brasília/DF",
    initials: "EP",
    color: "bg-orange",
    text: "Pedi três orçamentos de eletricista e fechei com o melhor custo-benefício. Processo rápido e transparente.",
    rating: 5,
    service: "Eletricista",
  },
  {
    id: "f3",
    name: "Tatiane Barros",
    city: "Águas Claras, Brasília/DF",
    initials: "TB",
    color: "bg-success",
    text: "O pedreiro que contratei pela plataforma reformou nosso banheiro com um capricho impressionante. Recomendo!",
    rating: 5,
    service: "Pedreiro",
  },
];


export function Testimonials() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  const { data: testimonials = fallbackTestimonials } = useQuery({
    queryKey: ["home-testimonials"],
    queryFn: async (): Promise<HomeTestimonial[]> => {
      const { data, error: err } = await supabase
        .from("testimonials")
        .select("id, author, role, company, content, rating, display_order")
        .eq("is_published", true)
        .order("display_order")
        .limit(6);
      if (err) throw err;
      if (!data?.length) return fallbackTestimonials;
      return data.map((t, i) => ({
        id: t.id,
        name: t.author,
        city: t.company ?? "Brasília/DF",
        initials: initialsOf(t.author),
        color: COLORS[i % COLORS.length],
        text: t.content,
        rating: t.rating ?? 5,
        service: t.role ?? "",
      }));
    },
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Digite um e-mail válido.");
      return;
    }
    if (!consent) {
      setError("Confirme que aceita receber comunicações.");
      return;
    }
    setError("");
    setEmail("");
    setConsent(false);
    toast.success("Inscrição confirmada!", {
      description: "Você receberá dicas e novidades por e-mail. (demonstração)",
    });
  };

  return (
    <section className="overflow-hidden bg-card py-16 sm:py-20" aria-labelledby="depoimentos">
      <div className="container-page grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <h2 id="depoimentos" className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            O que nossos clientes dizem
          </h2>
          <div className="mt-8 grid w-full min-w-0 max-w-full gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.id}
                className="flex min-w-0 flex-col rounded-3xl border border-border bg-background p-6 shadow-card"
              >
                <Quote size={22} className="text-primary" aria-hidden="true" />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                  {t.text}
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                  <ProAvatar initials={t.initials} color={t.color} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[t.city, t.service].filter(Boolean).join(" · ")}
                    </p>

                    <RatingStars rating={t.rating} size={12} showValue={false} className="mt-0.5" />
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-3xl bg-primary p-8 text-primary-foreground shadow-card">
          <h3 className="font-display text-2xl font-extrabold leading-tight">
            Receba dicas e encontre bons profissionais
          </h3>
          <p className="mt-2 text-sm text-primary-foreground/85">
            Conteúdo prático sobre casa, manutenção e contratação, direto no seu e-mail.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-3" noValidate>
            <div className="flex min-w-0 gap-2">
              <label htmlFor="newsletter-email" className="sr-only">
                Digite seu e-mail
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                className="h-12 w-full min-w-0 rounded-xl border-0 bg-card px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-orange"
              />
              <Button
                type="submit"
                aria-label="Inscrever e-mail"
                className="h-12 w-12 shrink-0 rounded-xl bg-orange p-0 text-orange-foreground hover:bg-orange/90"
              >
                <Send size={18} aria-hidden="true" />
              </Button>
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-xs text-primary-foreground/85">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[color:var(--orange)]"
              />
              Aceito receber comunicações da plataforma por e-mail.
            </label>
            {error && (
              <p role="alert" className="rounded-lg bg-card/15 px-3 py-2 text-xs font-medium">
                {error}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
