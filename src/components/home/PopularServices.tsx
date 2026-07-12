import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CategoryCard } from "@/components/shared/CategoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategories } from "@/services/categoryService";

export function PopularServices() {
  const { data, isLoading } = useQuery({
    queryKey: ["categories", "list"],
    queryFn: listCategories,
    staleTime: 5 * 60_000,
  });
  const categories = data ?? [];

  return (
    <section className="container-page overflow-hidden py-16 sm:py-20" aria-labelledby="servicos-populares">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 id="servicos-populares" className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Serviços populares
        </h2>
        <Link
          to="/categorias"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Ver todas as categorias
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className="grid min-w-0 gap-4 sm:hidden">
        {isLoading && categories.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))
          : categories.slice(0, 6).map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
      </div>

      <Carousel opts={{ align: "start" }} className="relative hidden w-full sm:block">
        <CarouselContent className="-ml-4">
          {isLoading && categories.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <CarouselItem key={i} className="pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/5">
                  <Skeleton className="h-72 rounded-3xl" />
                </CarouselItem>
              ))
            : categories.map((category) => (
                <CarouselItem key={category.slug} className="pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/5">
                  <CategoryCard category={category} />
                </CarouselItem>
              ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4 hidden h-11 w-11 border-border bg-card shadow-card sm:flex" />
        <CarouselNext className="-right-4 hidden h-11 w-11 border-border bg-card shadow-card sm:flex" />
      </Carousel>
    </section>
  );
}
