import { Link } from "@tanstack/react-router";
import { Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { images } from "@/data/images";
import type { Category } from "@/types";

type CategoryLike = Category & { imageUrl?: string; imageAlt?: string };

export function CategoryCard({ category }: { category: CategoryLike }) {
  const src =
    category.imageUrl && category.imageUrl.length > 0
      ? category.imageUrl
      : images[category.imageKey];
  const alt =
    category.imageAlt && category.imageAlt.length > 0
      ? category.imageAlt
      : `Profissional de ${category.name} trabalhando`;
  return (
    <Link
      to="/categoria/$slug"
      params={{ slug: category.slug }}
      className="group relative block h-72 overflow-hidden rounded-3xl shadow-card transition-shadow duration-200 hover:shadow-float focus-visible:outline-2 focus-visible:outline-ring"
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        width={800}
        height={1000}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-navy/90 via-navy/25 to-transparent" aria-hidden="true" />
      {category.badge && (
        <Badge className="absolute left-4 top-4 rounded-full bg-orange px-3 py-1 text-[11px] font-bold text-orange-foreground hover:bg-orange">
          {category.badge}
        </Badge>
      )}
      <div className="absolute inset-x-0 bottom-0 p-5 text-navy-foreground">
        <h3 className="font-display text-xl font-extrabold">{category.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-navy-foreground/90">
          <span className="inline-flex items-center gap-1">
            <Users size={12} aria-hidden="true" />
            {category.professionalsCount} profissionais
          </span>
          <span className="inline-flex items-center gap-1">
            <Star size={12} className="fill-rating text-rating" aria-hidden="true" />
            {category.rating.toFixed(1).replace(".", ",")}
          </span>
        </div>
        <p className="mt-1 text-xs text-navy-foreground/80">
          a partir de <span className="font-bold text-navy-foreground">R$ {category.priceFrom}</span>
        </p>
      </div>
    </Link>
  );
}
