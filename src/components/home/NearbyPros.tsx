import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { getProfessionals } from "@/services/mockApi";

const VISIBLE = 4;
const ROTATE_MS = 6000;

export function NearbyPros() {
  const { data, isLoading } = useQuery({
    queryKey: ["home-nearby-pros"],
    queryFn: getProfessionals,
  });

  const pool = useMemo(() => (data ?? []).filter((p) => !p.featured), [data]);
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
    return Array.from({ length: Math.min(VISIBLE, pool.length) }, (_, i) => pool[(offset + i) % pool.length]);
  }, [pool, offset]);

  const pages = canRotate ? Math.ceil(pool.length / VISIBLE) : 1;
  const activePage = canRotate ? Math.floor(offset / VISIBLE) % pages : 0;

  if (!isLoading && pool.length === 0) return null;


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

      <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div
          className={`grid gap-6 transition-all duration-300 sm:grid-cols-2 lg:grid-cols-4 ${
            fading ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          {isLoading
            ? Array.from({ length: VISIBLE }).map((_, i) => (
                <Skeleton key={i} className="h-[420px] rounded-3xl" />
              ))
            : visible.map((pro) => <ProfessionalCard key={pro.slug} pro={pro} />)}
        </div>

        {canRotate && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ver recomendados ${i + 1}`}
                onClick={() => {
                  setFading(true);
                  window.setTimeout(() => {
                    setOffset(i * VISIBLE);
                    setFading(false);
                  }, 200);
                }}
                className={`h-2 rounded-full transition-all ${
                  i === activePage ? "w-7 bg-primary" : "w-2 bg-border hover:bg-primary/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>

    </section>
  );
}
