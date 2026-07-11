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
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float">
      <div
        className="relative h-24 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_92%,white),color-mix(in_oklab,var(--primary)_54%,var(--orange)))] bg-cover bg-center"
        style={pro.coverUrl ? { backgroundImage: `url(${pro.coverUrl})` } : undefined}
      />
      <div className="absolute right-4 top-4 z-10">
        <FavoriteButton slug={pro.slug} name={pro.name} />
      </div>
      <div className="relative flex flex-1 flex-col p-5 pt-0">
        <div className="-mt-9 flex items-end justify-between gap-3">
          <ProAvatar
            initials={pro.initials}
            color={pro.avatarColor}
            imageUrl={pro.avatarUrl ?? undefined}
            alt={pro.name}
            size="lg"
            className="border-4 border-card shadow-card"
          />
        </div>
        <div className="mt-3 min-w-0">
          <h3 className="flex items-center gap-1.5 font-display text-base font-bold text-foreground">
            <span className="truncate">{pro.name}</span>
            {pro.verified && (
              <BadgeCheck size={17} className="shrink-0 text-success" aria-label="Profissional verificado" />
            )}
          </h3>
          <p className="truncate text-sm text-muted-foreground">{pro.specialty}</p>
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
