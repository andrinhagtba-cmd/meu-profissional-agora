import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { images } from "@/data/images";
import { SearchPanel } from "./SearchPanel";

const avatars = [
  { initials: "MT", color: "bg-primary" },
  { initials: "RS", color: "bg-orange" },
  { initials: "AF", color: "bg-success" },
  { initials: "EP", color: "bg-navy" },
];

export function Hero() {
  return (
    <section className="relative" aria-label="Encontre o profissional certo">
      <div className="relative overflow-hidden bg-secondary">
        <img
          src={images.hero}
          alt="Eletricista sorridente instalando luminária em apartamento enquanto a cliente observa"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover object-right"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 bg-linear-to-r from-background via-background/85 to-transparent"
          aria-hidden="true"
        />

        <div className="container-page relative pb-40 pt-14 sm:pb-44 lg:pb-48 lg:pt-20">
          <div className="max-w-xl">
            <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
              Encontre o{" "}
              <span className="text-hand whitespace-nowrap text-5xl font-bold text-orange sm:text-6xl lg:text-7xl">
                profissional certo.
              </span>
              <br />
              Resolva sem complicação.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Compare profissionais, consulte avaliações e solicite orçamentos de quem atende perto
              de você.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-13 rounded-xl px-7 text-base font-semibold">
                <Link to="/buscar" search={{} as never}>
                  Encontrar profissional
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-13 rounded-xl border-border bg-card px-7 text-base font-semibold text-foreground hover:bg-secondary"
              >
                <Link to="/pedir-orcamento">Pedir orçamento</Link>
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2.5" aria-hidden="true">
                {avatars.map((a) => (
                  <span
                    key={a.initials}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-card text-xs font-bold text-primary-foreground ${a.color}`}
                  >
                    {a.initials}
                  </span>
                ))}
              </div>
              <p className="text-sm font-medium text-foreground">
                Mais de <span className="font-bold">25 mil clientes</span> já encontraram ajuda.
              </p>
            </div>
          </div>

          <div className="absolute right-8 top-16 hidden w-64 rounded-3xl bg-card/95 p-5 shadow-float backdrop-blur lg:block">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
              <MapPin size={20} aria-hidden="true" />
            </span>
            <h2 className="mt-3 font-display text-base font-bold text-foreground">
              Atendimento perto de você
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Encontre profissionais disponíveis na sua região.
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-bold text-success">
              <Zap size={13} aria-hidden="true" />
              Resposta rápida
            </p>
          </div>
        </div>
      </div>

      <div className="container-page relative z-10 -mt-32 sm:-mt-32">
        <SearchPanel />
      </div>
    </section>
  );
}
