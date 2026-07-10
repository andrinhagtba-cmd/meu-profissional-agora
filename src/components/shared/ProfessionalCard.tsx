import { Link } from "@tanstack/react-router";
import { BadgeCheck, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { ProAvatar } from "@/components/shared/ProAvatar";
import { RatingStars } from "@/components/shared/RatingStars";
import type { Professional } from "@/types";

export function ProfessionalCard({ pro }: { pro: Professional }) {
  return (
    <article className="group relative flex flex-col rounded-3xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ProAvatar initials={pro.initials} color={pro.avatarColor} size="lg" />
          <div className="min-w-0">
            <h3 className="flex items-center gap-1.5 font-display text-base font-bold text-foreground">
              <span className="truncate">{pro.name}</span>
              {pro.verified && (
                <BadgeCheck size={17} className="shrink-0 text-success" aria-label="Profissional verificado" />
              )}
            </h3>
            <p className="truncate text-sm text-muted-foreground">{pro.specialty}</p>
          </div>
        </div>
        <FavoriteButton slug={pro.slug} name={pro.name} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {pro.sponsored ? (
          <Badge variant="outline" className="rounded-full border-border text-[11px] font-medium text-muted-foreground">
            Patrocinado
          </Badge>
        ) : pro.badge ? (
          <Badge className="rounded-full bg-secondary text-[11px] font-semibold text-primary hover:bg-secondary">
            {pro.badge}
          </Badge>
        ) : null}
        {pro.emergency && (
          <Badge className="rounded-full bg-success-soft text-[11px] font-semibold text-success hover:bg-success-soft">
            Atende emergência
          </Badge>
        )}
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <RatingStars rating={pro.rating} />
          <span className="text-xs">({pro.reviewsCount} avaliações)</span>
        </div>
        <p className="flex items-center gap-1.5">
          <MapPin size={14} className="shrink-0 text-primary" aria-hidden="true" />
          {pro.city}, {pro.state} · {pro.distanceKm.toFixed(1).replace(".", ",")} km
        </p>
        <p className="flex items-center gap-1.5">
          <Clock size={14} className="shrink-0 text-primary" aria-hidden="true" />
          Responde em {pro.responseTime}
        </p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted-foreground">a partir de</p>
          <p className="font-display text-lg font-extrabold text-foreground">
            R$ {pro.priceFrom.toLocaleString("pt-BR")}
          </p>
        </div>
        <Button asChild className="h-11 rounded-xl px-5 font-semibold">
          <Link to="/profissional/$slug" params={{ slug: pro.slug }}>
            Ver perfil
          </Link>
        </Button>
      </div>
    </article>
  );
}
