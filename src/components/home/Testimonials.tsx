import { Quote, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/shared/RatingStars";
import { ProAvatar } from "@/components/shared/ProAvatar";

const testimonials = [
  {
    name: "Renata Silveira",
    city: "São Paulo, SP",
    initials: "RS",
    color: "bg-primary",
    text: "Encontrei uma diarista incrível em menos de uma hora. As avaliações me deram total segurança para contratar.",
    rating: 5,
    service: "Diarista",
  },
  {
    name: "Eduardo Prado",
    city: "Curitiba, PR",
    initials: "EP",
    color: "bg-orange",
    text: "Pedi três orçamentos de eletricista e fechei com o melhor custo-benefício. Processo rápido e transparente.",
    rating: 5,
    service: "Eletricista",
  },
  {
    name: "Tatiane Barros",
    city: "Belo Horizonte, MG",
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
    <section className="bg-card py-16 sm:py-20" aria-labelledby="depoimentos">
      <div className="container-page grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 id="depoimentos" className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            O que nossos clientes dizem
          </h2>
          <div className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="flex w-[85%] shrink-0 snap-start flex-col rounded-3xl border border-border bg-background p-6 shadow-card sm:w-96 lg:w-auto"
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
                      {t.city} · {t.service}
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
            <div className="flex gap-2">
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
              Aceito receber comunicações da ProConecta por e-mail.
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
