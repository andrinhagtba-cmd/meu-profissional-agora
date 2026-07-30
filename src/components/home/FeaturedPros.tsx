import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Clock, Sparkles, Star, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { ProAvatar } from "@/components/shared/ProAvatar";
import { getFeaturedProfessionals } from "@/services/mockApi";
import { ProLocationBlock } from "@/components/shared/ProLocationBlock";
import { ZoomableImageArea, ZoomableThumb } from "@/components/shared/ImageLightbox";
import type { Professional } from "@/types";

const VISIBLE = 4;
const ROTATE_MS = 15000;

export function FeaturedPros() {
  const { data: pros, isLoading } = useQuery({
    queryKey: ["featured-pros", "pool"],
    queryFn: () => getFeaturedProfessionals(24),
  });

  const pool = useMemo(() => pros ?? [], [pros]);
  const [offset, setOffset] = useState(0);
  const [fading, setFading] = useState(false);
  const [paused, setPaused] = useState(false);

  const canRotate = pool.length > VISIBLE;

  useEffect(() => {
    if (!canRotate || paused) return;
    const id = window.setInterval(() => {
      setFading(true);
      window.setTimeout(() => {
        setOffset((o) => (o + VISIBLE) % pool.length);
        setFading(false);
      }, 260);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [canRotate, paused, pool.length]);

  const visible = useMemo(() => {
    if (pool.length === 0) return [];
    return Array.from({ length: Math.min(VISIBLE, pool.length) }, (_, i) => {
      const item = pool[(offset + i) % pool.length];
      return { pro: item, rank: ((offset + i) % pool.length) + 1 };
    });
  }, [pool, offset]);

  const pages = canRotate ? Math.ceil(pool.length / VISIBLE) : 1;
  const activePage = canRotate ? Math.floor(offset / VISIBLE) % pages : 0;


  return (
    <section
      className="relative overflow-hidden py-16 sm:py-20"
      aria-labelledby="profissionais-destaque"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 via-background to-background" />
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-orange/15 blur-3xl" />
      </div>

      <div className="container-page">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles size={13} aria-hidden="true" />
              Profissionais em destaque
            </span>
            <h2
              id="profissionais-destaque"
              className="mt-3 font-display text-3xl font-extrabold leading-tight text-foreground sm:text-4xl"
            >
              Os mais bem avaliados{" "}
              <span className="italic text-primary">da semana</span>
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Profissionais verificados, avaliações reais e tempo de resposta comprovado.
              Escolha com confiança.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-xl border-border bg-card px-5 font-semibold shadow-card hover:bg-secondary"
          >
            <Link to="/profissionais" search={{ destaque: true }}>
              Ver todos
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className={`grid gap-6 transition-all duration-300 sm:grid-cols-2 lg:grid-cols-4 ${
              fading ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
            }`}
          >
            {isLoading
              ? Array.from({ length: VISIBLE }).map((_, i) => (
                  <Skeleton key={i} className="h-[420px] rounded-3xl" />
                ))
              : visible.map(({ pro, rank }) => (
                  <PremiumProCard key={pro.slug} pro={pro} rank={rank} />
                ))}
          </div>

          {canRotate && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: pages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ver destaques ${i + 1}`}
                  onClick={() => {
                    setFading(true);
                    window.setTimeout(() => {
                      setOffset(i * VISIBLE);
                      setFading(false);
                    }, 200);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    i === activePage
                      ? "w-7 bg-primary"
                      : "w-2 bg-border hover:bg-primary/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

function PremiumProCard({ pro, rank }: { pro: Professional; rank: number }) {
  const topServices = pro.services.slice(0, 2);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-float">
      {/* Cover */}
      <ZoomableImageArea src={pro.coverUrl} alt={pro.name} className="relative h-28 overflow-hidden">
        <div
          className="absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_92%,white),color-mix(in_oklab,var(--primary)_54%,var(--orange)))] bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={pro.coverUrl ? { backgroundImage: `url(${pro.coverUrl})` } : undefined}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

        {/* Top row: rank + favorite */}
        <div className="absolute inset-x-3 top-3 z-10 flex items-start justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-primary shadow-sm backdrop-blur">
            #{rank} em destaque
          </span>
          <FavoriteButton slug={pro.slug} name={pro.name} />
        </div>
      </ZoomableImageArea>

      {/* Body */}
      <div className="relative flex flex-1 flex-col px-5 pb-5 pt-0">
        <div className="-mt-9 flex items-end justify-between gap-3">
          <ZoomableThumb src={pro.avatarUrl} alt={pro.name}>
            <ProAvatar
              initials={pro.initials}
              color={pro.avatarColor}
              imageUrl={pro.avatarUrl ?? undefined}
              alt={pro.name}
              size="lg"
              className="border-4 border-card shadow-card"
            />
          </ZoomableThumb>

          <div className="mb-1 flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-foreground">
            <Star size={13} className="fill-orange text-orange" aria-hidden="true" />
            {pro.rating.toFixed(1)}
            <span className="font-medium text-muted-foreground">
              ({pro.reviewsCount})
            </span>
          </div>
        </div>

        <div className="mt-3 min-w-0">
          <h3 className="flex items-center gap-1.5 font-display text-lg font-bold leading-tight text-foreground">
            <span className="truncate">{pro.name}</span>
            {pro.verified && (
              <BadgeCheck
                size={17}
                className="shrink-0 text-success"
                aria-label="Verificado"
              />
            )}
          </h3>
          <p className="mt-0.5 truncate text-sm font-medium text-primary">
            {pro.specialty}
          </p>
        </div>

        <ProLocationBlock pro={pro} size="sm" className="mt-2.5" />
        {pro.responseTime && pro.responseTime !== "—" && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock size={11} aria-hidden="true" />
            Responde em {pro.responseTime}
          </p>
        )}

        {/* Chips: emergency + services */}
        {(pro.emergency || topServices.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {pro.emergency && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange/10 px-2.5 py-1 text-[11px] font-semibold text-orange">
                <Zap size={11} aria-hidden="true" />
                Emergência 24h
              </span>
            )}
            {topServices.map((s) => (
              <Badge
                key={s.name}
                variant="outline"
                className="rounded-full border-border bg-secondary/60 text-[11px] font-medium text-foreground"
              >
                {s.name}
              </Badge>
            ))}
          </div>
        )}


        {/* Footer */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {pro.priceLabel?.trim() || "a partir de"}
            </p>
            <p className="font-display text-xl font-extrabold text-foreground">
              R$ {pro.priceFrom.toLocaleString("pt-BR")}
            </p>
          </div>
          <Button
            asChild
            className="h-11 rounded-xl bg-primary px-4 font-semibold text-primary-foreground shadow-sm transition-all group-hover:bg-primary/90"
          >
            <Link to="/profissional/$slug" params={{ slug: pro.slug }}>
              Ver perfil
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Hover accent line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary via-primary to-orange transition-transform duration-300 group-hover:scale-x-100"
      />
    </article>
  );
}
