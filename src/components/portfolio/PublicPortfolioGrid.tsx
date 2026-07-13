import { useState } from "react";
import { Bookmark, ExternalLink, Heart, ImageIcon, MessageCircle, MoreHorizontal, Play, Send, Sparkles } from "lucide-react";
import type { PortfolioItemVM } from "@/services/professionalMediaService";
import { isVerticalMedia } from "@/lib/portfolioUrls";
import { PortfolioLightbox } from "./PortfolioLightbox";
import { InstagramEmbed } from "./InstagramEmbed";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { cn } from "@/lib/utils";

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

function InstagramReelCard({ item }: { item: PortfolioItemVM }) {
  return (
    <figure className="group relative mx-auto w-full max-w-[390px] overflow-hidden rounded-[2rem] bg-neutral-950 p-1.5 shadow-[0_28px_70px_-36px_rgba(16,24,40,0.65)] ring-1 ring-neutral-950/10 transition-all duration-500 hover:-translate-y-1">
      <div className="relative overflow-hidden rounded-[1.65rem] bg-neutral-950">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-gradient-to-b from-neutral-950/90 via-neutral-950/45 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-40 bg-gradient-to-t from-neutral-950/95 via-neutral-950/55 to-transparent" />

        <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4 text-white">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-extrabold tracking-normal">Reels</span>
            <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
            <span className="text-[11px] font-semibold text-white/75">Portfólio</span>
          </div>
          <MoreHorizontal size={20} strokeWidth={2.25} />
        </div>

        <div className="relative aspect-[9/16] overflow-hidden bg-neutral-950">
          {item.embed_url ? (
            <InstagramEmbed embedUrl={item.embed_url} title={item.title} interactive className="rounded-none" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-neutral-900 text-white/45">
              <Play size={42} fill="currentColor" />
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute bottom-5 right-3 z-30 flex flex-col items-center gap-4 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
          <span className="grid gap-1 place-items-center">
            <Heart size={24} strokeWidth={2.2} />
            <span className="text-[10px] font-bold">Curtir</span>
          </span>
          <span className="grid gap-1 place-items-center">
            <MessageCircle size={24} strokeWidth={2.2} />
            <span className="text-[10px] font-bold">Comentar</span>
          </span>
          <span className="grid gap-1 place-items-center">
            <Send size={23} strokeWidth={2.2} />
            <span className="text-[10px] font-bold">Enviar</span>
          </span>
          <Bookmark size={23} strokeWidth={2.2} />
        </div>

        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-5 pr-16 text-white">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-[11px] font-black ring-1 ring-white/25 backdrop-blur">
              IG
            </span>
            <span className="line-clamp-1 text-sm font-extrabold">{item.title || "Trabalho recente"}</span>
          </div>
          {item.caption && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/82">{item.caption}</p>}
        </figcaption>
      </div>
      {item.external_url && (
        <a
          href={item.external_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-card px-4 py-3 text-xs font-extrabold text-foreground ring-1 ring-border transition-colors hover:bg-muted"
        >
          Ver publicação original <ExternalLink size={14} />
        </a>
      )}
    </figure>
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

          if (isInstagram) return <InstagramReelCard key={item.id} item={item} />;

          return (
            <figure
              key={item.id}
              className={cn(
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

      <PortfolioLightbox
        items={imageItems}
        startIndex={imageIndex ?? 0}
        open={imageIndex !== null}
        onClose={() => setImageIndex(null)}
      />
    </>
  );
}
