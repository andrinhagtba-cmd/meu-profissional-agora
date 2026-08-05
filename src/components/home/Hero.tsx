import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { images } from "@/data/images";
import { SearchPanel } from "./SearchPanel";
import { supabase } from "@/integrations/supabase/client";
import { useResolvedMediaUrl } from "@/lib/mediaUrl";


const avatars = [
  { initials: "MT", color: "bg-primary" },
  { initials: "RS", color: "bg-orange" },
  { initials: "AF", color: "bg-success" },
  { initials: "EP", color: "bg-navy" },
];

type HeroBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  highlight_text: string | null;
  cta_primary_label: string | null;
  cta_primary_href: string | null;
  cta_secondary_label: string | null;
  cta_secondary_href: string | null;
};

const DEFAULT_HERO: HeroBanner = {
  id: "default",
  title: "Encontre as {{highlight}} e profissionais do DF e entorno em um só lugar.",
  subtitle:
    "Compare, consulte avaliações e solicite orçamentos de quem atende perto de você com segurança.",
  image_url: null,
  highlight_text: "melhores empresas",
  cta_primary_label: "Encontrar profissional",
  cta_primary_href: "/buscar",
  cta_secondary_label: "Pedir orçamento",
  cta_secondary_href: "/pedir-orcamento",
};

async function fetchHeroBanners(): Promise<HeroBanner[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("banners")
    .select(
      "id,title,subtitle,image_url,highlight_text,cta_primary_label,cta_primary_href,cta_secondary_label,cta_secondary_href,starts_at,ends_at,display_order,created_at,is_active,position",
    )
    .eq("position", "hero")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).filter((b) => {
    if (b.starts_at && b.starts_at > nowIso) return false;
    if (b.ends_at && b.ends_at < nowIso) return false;
    return true;
  }) as HeroBanner[];
}

export function Hero() {
  const { data } = useQuery({ queryKey: ["hero-banners"], queryFn: fetchHeroBanners });
  const banners = data && data.length > 0 ? data : [DEFAULT_HERO];
  const [index, setIndex] = useState(0);
  const total = banners.length;
  const active = banners[Math.min(index, total - 1)];
  const activeImage = useResolvedMediaUrl(active.image_url);

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 7000);
    return () => clearInterval(t);
  }, [total]);

  return (
    <section className="relative overflow-hidden" aria-label="Encontre o profissional certo">
      <div className="relative overflow-hidden bg-secondary">
        {/* Mobile: full-bleed image block with bottom fade — text flows below */}
        <div className="relative overflow-hidden md:hidden">
          <picture key={active.id}>
            {!activeImage && (
              <source media="(max-width: 767px)" srcSet={images.heroMobile} />
            )}
            <img
              src={activeImage || images.heroMobile}
              alt=""
              width={1024}
              height={1536}
              className="h-[32rem] w-full scale-150 object-cover object-[72%_92%] transition-opacity duration-500"
              fetchPriority="high"
            />
          </picture>
          <div
            className="absolute inset-0 bg-linear-to-t from-secondary via-secondary/10 to-transparent"
            aria-hidden="true"
          />
        </div>

        {/* Desktop: image as absolute background with left gradient */}
        <picture key={active.id} className="hidden md:block">
          <img
            src={activeImage || images.hero}
            alt=""
            width={1920}
            height={1088}
            className="absolute inset-0 h-full w-full object-cover object-[right_25%] transition-opacity duration-500"
            fetchPriority="high"
          />
        </picture>
        <div
          className="absolute inset-0 hidden bg-linear-to-r from-background via-background/85 to-transparent md:block"
          aria-hidden="true"
        />

        <div className="container-page relative -mt-16 pb-40 pt-0 md:mt-0 md:pb-56 md:pt-20">
          <div className="max-w-xl">
            <HeroTitle title={active.title} highlight={active.highlight_text} />
            {active.subtitle && (
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                {active.subtitle}
              </p>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {active.cta_primary_label && active.cta_primary_href && (
                <Button asChild className="h-13 rounded-xl px-7 text-base font-semibold">
                  <CtaLink href={active.cta_primary_href}>
                    {active.cta_primary_label}
                    <ArrowRight size={18} aria-hidden="true" />
                  </CtaLink>
                </Button>
              )}
              {active.cta_secondary_label && active.cta_secondary_href && (
                <Button
                  asChild
                  variant="outline"
                  className="h-13 rounded-xl border-border bg-card px-7 text-base font-semibold text-foreground hover:bg-secondary"
                >
                  <CtaLink href={active.cta_secondary_href}>{active.cta_secondary_label}</CtaLink>
                </Button>
              )}
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

          {total > 1 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex items-center justify-between px-4 sm:px-8">
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + total) % total)}
                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-card/90 text-foreground shadow-float backdrop-blur transition hover:bg-card"
                aria-label="Banner anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="pointer-events-auto flex items-center gap-1.5">
                {banners.map((b, i) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Ir para banner ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      i === index ? "w-6 bg-primary" : "w-2 bg-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % total)}
                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-card/90 text-foreground shadow-float backdrop-blur transition hover:bg-card"
                aria-label="Próximo banner"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container-page relative z-10 -mt-32 min-w-0 sm:-mt-32">
        <SearchPanel />
      </div>
    </section>
  );
}

function HeroTitle({ title, highlight }: { title: string; highlight: string | null }) {
  const marker = "{{highlight}}";
  const hl = highlight?.trim();
  if (hl && title.includes(marker)) {
    const [before, after] = title.split(marker);
    return (
      <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
        {before}
        <span className="text-hand text-5xl font-bold text-orange sm:whitespace-nowrap sm:text-6xl lg:text-7xl">
          {hl}
        </span>
        {after}
      </h1>
    );
  }
  return (
    <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
      {hl ? (
        <>
          <span className="text-hand text-5xl font-bold text-orange sm:whitespace-nowrap sm:text-6xl lg:text-7xl">
            {hl}
          </span>{" "}
        </>
      ) : null}
      {title}
    </h1>
  );
}

function CtaLink({
  href,
  children,
  ...rest
}: { href: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = /^https?:\/\//i.test(href);
  if (external) {
    return (
      <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link {...(rest as Record<string, unknown>)} to={href} search={{} as never}>
      {children}
    </Link>

  );
}

