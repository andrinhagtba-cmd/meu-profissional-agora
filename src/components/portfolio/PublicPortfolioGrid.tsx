import { useState } from "react";
import { ImageIcon, Sparkles } from "lucide-react";
import type { PortfolioItemVM } from "@/services/professionalMediaService";
import { isVerticalMedia } from "@/lib/portfolioUrls";
import { PortfolioLightbox } from "./PortfolioLightbox";
import { InstagramEmbed } from "./InstagramEmbed";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { cn } from "@/lib/utils";

/** Inline SVG glyphs — mais elegantes que os ícones lucide padrão para branding. */
function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F9CE34" />
          <stop offset="50%" stopColor="#EE2A7B" />
          <stop offset="100%" stopColor="#6228D7" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5.5" stroke="url(#ig-grad)" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="url(#ig-grad)" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="url(#ig-grad)" />
    </svg>
  );
}

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

export function PublicPortfolioGrid({ items }: { items: PortfolioItemVM[] }) {
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  if (items.length === 0) return null;

  const imageItems = items.filter((it) => it.media_type === "image");

  return (
    <>
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const isImage = item.media_type === "image";
          const isInstagram = item.media_type === "instagram_reel";
          const isYouTube = item.media_type.startsWith("youtube");
          const vertical = isVerticalMedia(item.media_type);

          // Sombra neutra premium, sem cores da plataforma
          const glow = "shadow-[0_20px_50px_-25px_rgba(0,0,0,0.35)]";

          // Instagram: phone frame preto neutro (sem borda gradiente).
          // Outros: card padrão com borda sutil.
          return (
            <figure
              key={item.id}
              className={cn(
                "group relative transition-all duration-500 hover:-translate-y-1.5",
                isInstagram
                  ? "rounded-[2.25rem] bg-neutral-900 p-2 ring-1 ring-neutral-800"
                  : "rounded-[24px] border border-border bg-card p-0",
                glow,
              )}
            >
              <div
                className={cn(
                  "overflow-hidden bg-card",
                  isInstagram ? "rounded-[1.85rem]" : "rounded-[24px]",
                )}
              >
                <div
                  className={cn(
                    "relative w-full overflow-hidden bg-neutral-950",
                    vertical && !isInstagram ? "aspect-[9/16]" : !isInstagram ? "aspect-video" : "",
                  )}
                >
                  {isInstagram && item.embed_url ? (
                    <InstagramEmbed
                      embedUrl={item.embed_url}
                      title={item.title}
                      interactive
                      className="rounded-none"
                    />
                  ) : isYouTube && item.embed_url ? (
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
                  {!isInstagram && (
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
                  )}
                </div>

                {(item.title || item.caption) && (
                  <figcaption className="relative px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full",
                          isInstagram
                            ? "bg-gradient-to-br from-[#F9CE34]/15 via-[#EE2A7B]/15 to-[#6228D7]/15"
                            : isYouTube
                              ? "bg-red-500/10"
                              : "bg-primary/10",
                        )}
                      >
                        {isInstagram ? (
                          <InstagramGlyph className="h-4 w-4" />
                        ) : isYouTube ? (
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

      <PortfolioLightbox
        items={imageItems}
        startIndex={imageIndex ?? 0}
        open={imageIndex !== null}
        onClose={() => setImageIndex(null)}
      />
    </>
  );
}
