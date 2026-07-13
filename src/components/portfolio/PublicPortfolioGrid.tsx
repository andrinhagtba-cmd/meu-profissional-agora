import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, ImageIcon, Play, Sparkles } from "lucide-react";

import type { PortfolioItemVM } from "@/services/professionalMediaService";
import { isVerticalMedia } from "@/lib/portfolioUrls";
import { PortfolioLightbox } from "./PortfolioLightbox";
import { InstagramEmbed } from "./InstagramEmbed";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function YouTubeGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M22.5 6.5c-.25-1.4-1.3-2.45-2.7-2.7C17.2 3.3 12 3.3 12 3.3s-5.2 0-7.8.5C2.8 4.05 1.75 5.1 1.5 6.5 1 9.1 1 12 1 12s0 2.9.5 5.5c.25 1.4 1.3 2.45 2.7 2.7 2.6.5 7.8.5 7.8.5s5.2 0 7.8-.5c1.4-.25 2.45-1.3 2.7-2.7.5-2.6.5-5.5.5-5.5s0-2.9-.5-5.5Z"
        fill="#FF0033"
      />
      <path d="M9.75 15.5V8.5L15.75 12l-6 3.5Z" fill="#fff" />
    </svg>
  );
}

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <defs>
        <linearGradient id="ig-grad-card" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset="0.35" stopColor="#FA7E1E" />
          <stop offset="0.65" stopColor="#D62976" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="url(#ig-grad-card)" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" stroke="url(#ig-grad-card)" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.6" r="1.15" fill="url(#ig-grad-card)" />
    </svg>
  );
}

function InstagramReelCard({ item }: { item: PortfolioItemVM }) {
  const handle = "instagram";
  return (
    <figure className="group relative mx-auto w-full max-w-[380px]">
      <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_20px_60px_-32px_rgba(15,23,42,0.35)] ring-1 ring-neutral-200/80 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)]">
        {/* Header — IG-style, refined */}
        <header className="flex items-center gap-3 px-4 py-3">
          <span className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5] p-[2px]">
            <span className="grid h-full w-full place-items-center rounded-full bg-white">
              <InstagramGlyph className="h-5 w-5" />
            </span>
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-semibold text-neutral-900">{handle}</p>
            <p className="text-[11px] font-medium text-neutral-500">Instagram · Reel</p>
          </div>
        </header>

        {/* Media — video fits fully, no cropping */}
        <div className="relative aspect-[9/16] w-full overflow-hidden bg-neutral-950">
          {item.embed_url ? (
            <InstagramEmbed embedUrl={item.embed_url} title={item.title} interactive fit="cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-white/45">
              <Play size={42} fill="currentColor" />
            </div>
          )}
        </div>


        {/* Caption */}
        {(item.title || item.caption) && (
          <figcaption className="px-4 pb-2 pt-2">
            {item.title && (
              <p className="line-clamp-1 text-[13px] font-semibold text-neutral-900">{item.title}</p>
            )}
            {item.caption && (
              <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-neutral-600">{item.caption}</p>
            )}
          </figcaption>
        )}

        {/* CTA footer */}
        {item.external_url && (
          <a
            href={item.external_url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 flex items-center justify-center gap-2 border-t border-neutral-100 px-4 py-3 text-[12px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
          >
            <InstagramGlyph className="h-4 w-4" />
            Ver mais no Instagram
            <ExternalLink size={12} className="opacity-60" />
          </a>
        )}
      </div>
    </figure>
  );
}


export function PublicPortfolioGrid({ items }: { items: PortfolioItemVM[] }) {
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;

  const imageItems = items.filter((it) => it.media_type === "image");

  const scrollBy = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const firstChild = el.firstElementChild as HTMLElement | null;
    const gap = 20;
    const step = firstChild ? firstChild.offsetWidth + gap : 380;
    el.scrollTo({ left: el.scrollLeft + direction * step, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="mt-5 flex gap-5 overflow-x-auto scroll-smooth px-[7.5vw] pb-4 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        {items.map((item) => {

          const isImage = item.media_type === "image";
          const isInstagram = item.media_type === "instagram_reel";
          const isYouTube = item.media_type.startsWith("youtube");
          const vertical = isVerticalMedia(item.media_type);

          const slideCls = "snap-center shrink-0 w-[85vw] sm:w-[360px]";

          if (isInstagram)
            return (
              <div key={item.id} className={slideCls}>
                <InstagramReelCard item={item} />
              </div>
            );

          return (
            <figure
              key={item.id}
              className={cn(
                slideCls,
                "group relative rounded-[24px] border border-border bg-card p-0 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.35)] transition-all duration-500 hover:-translate-y-1.5",
              )}

            >
              <div
                className={cn(
                  "overflow-hidden bg-card",
                   "rounded-[24px]",
                )}
              >
                <div
                  className={cn(
                    "relative w-full overflow-hidden bg-neutral-950",
                     vertical ? "aspect-[9/16]" : "aspect-video",
                  )}
                >
                  {isYouTube && item.embed_url ? (
                    <YouTubeEmbed
                      embedUrl={item.embed_url}
                      thumbnailUrl={item.thumbnail_url}
                      title={item.title}
                      vertical={item.media_type === "youtube_short"}
                      autoplay
                      className="rounded-none"
                    />
                  ) : isImage && item.url ? (
                    <button
                      type="button"
                      onClick={() => {
                        const idx = imageItems.findIndex((it) => it.id === item.id);
                        setImageIndex(idx >= 0 ? idx : 0);
                      }}
                      className="block h-full w-full"
                      aria-label={`Ampliar ${item.title ?? "imagem"}`}
                    >
                      <img
                        src={item.url}
                        alt={item.alt_text ?? item.title ?? ""}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
                      />
                    </button>
                  ) : (
                    <div className="grid h-full w-full place-items-center text-white/30">
                      <ImageIcon size={40} />
                    </div>
                  )}

                  {/* Selo flutuante — sem chip retangular; glyph puro sobre glass */}
                  <span
                    className={cn(
                      "pointer-events-none absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full",
                      "bg-white/85 shadow-lg ring-1 ring-white backdrop-blur-md",
                      "transition-transform duration-500 group-hover:scale-110",
                    )}
                  >
                    {isYouTube ? (
                      <YouTubeGlyph className="h-5 w-5" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-primary" strokeWidth={2.4} />
                    )}
                  </span>
                </div>

                {(item.title || item.caption) && (
                  <figcaption className="relative px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full",
                          isYouTube ? "bg-red-500/10" : "bg-primary/10",
                        )}
                      >
                        {isYouTube ? (
                          <YouTubeGlyph className="h-4 w-4" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        {item.title && (
                          <p className="line-clamp-1 text-sm font-bold tracking-tight text-foreground">
                            {item.title}
                          </p>
                        )}
                        {item.caption && (
                          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {item.caption}
                          </p>
                        )}
                      </div>
                    </div>
                  </figcaption>
                )}
              </div>
            </figure>
          );
        })}
      </div>

      {items.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 rounded-full bg-white/95 shadow-lg backdrop-blur-sm hover:bg-white sm:left-2 sm:h-10 sm:w-10"
            onClick={() => scrollBy(-1)}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 rounded-full bg-white/95 shadow-lg backdrop-blur-sm hover:bg-white sm:right-2 sm:h-10 sm:w-10"
            onClick={() => scrollBy(1)}
            aria-label="Próximo"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      <PortfolioLightbox
        items={imageItems}
        startIndex={imageIndex ?? 0}
        open={imageIndex !== null}
        onClose={() => setImageIndex(null)}
      />
    </div>
  );
}
