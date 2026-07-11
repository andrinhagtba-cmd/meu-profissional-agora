import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { images } from "@/data/images";
import { getFeaturedProfessionals } from "@/services/mockApi";
import bgImage from "@/assets/featured-pros-bg.jpg";


export function FeaturedPros() {
  const { data: pros, isLoading } = useQuery({
    queryKey: ["featured-pros"],
    queryFn: getFeaturedProfessionals,
  });

  return (
    <section className="container-page pb-16 sm:pb-20" aria-labelledby="profissionais-destaque">
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-navy p-8 text-navy-foreground shadow-card">
          <div className="relative z-10">
            <h2 id="profissionais-destaque" className="font-display text-3xl font-extrabold leading-tight">
              Encontre profissionais bem avaliados
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-navy-foreground/80">
              Compare experiência, avaliações e disponibilidade.
            </p>
            <Button
              asChild
              className="mt-6 h-12 rounded-xl bg-orange px-6 font-semibold text-orange-foreground hover:bg-orange/90"
            >
              <Link to="/profissionais">
                Ver profissionais
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <img
            src={images.promoTools}
            alt=""
            loading="lazy"
            width={800}
            height={800}
            className="pointer-events-none relative z-0 mt-6 w-56 self-end opacity-95 lg:mt-10"
          />
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/30 blur-3xl" aria-hidden="true" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-3xl" />
              ))
            : pros?.map((pro) => <ProfessionalCard key={pro.slug} pro={pro} />)}
        </div>
      </div>
    </section>
  );
}
