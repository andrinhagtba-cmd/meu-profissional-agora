import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { getProfessionals } from "@/services/mockApi";

export function NearbyPros() {
  const { data, isLoading } = useQuery({
    queryKey: ["home-nearby-pros"],
    queryFn: getProfessionals,
  });

  const pros = (data ?? []).filter((p) => !p.featured).slice(0, 8);

  if (!isLoading && pros.length === 0) return null;

  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="profissionais-proximos">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Compass size={13} aria-hidden="true" />
            Profissionais recomendados
          </span>
          <h2
            id="profissionais-proximos"
            className="mt-3 font-display text-3xl font-extrabold leading-tight text-foreground sm:text-4xl"
          >
            Profissionais <span className="italic text-primary">perto de você</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Perfis verificados prontos para atender a sua região. Compare avaliações,
            preço e tempo de resposta.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-xl border-border bg-card px-5 font-semibold shadow-card hover:bg-secondary"
        >
          <Link to="/profissionais">
            Ver todos
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[420px] rounded-3xl" />
            ))
          : pros.map((pro) => <ProfessionalCard key={pro.slug} pro={pro} />)}
      </div>
    </section>
  );
}
