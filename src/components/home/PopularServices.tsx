import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CategoryCard } from "@/components/shared/CategoryCard";
import { categories } from "@/data/categories";

export function PopularServices() {
  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="servicos-populares">
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

      <Carousel opts={{ align: "start" }} className="relative">
        <CarouselContent className="-ml-4">
          {categories.map((category) => (
            <CarouselItem key={category.slug} className="pl-4 basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/5">
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
