import { useState } from "react";
import { Instagram, Youtube, Image as ImageIcon } from "lucide-react";
import type { PortfolioItemVM } from "@/services/professionalMediaService";
import { isVerticalMedia } from "@/lib/portfolioUrls";
import { PortfolioLightbox } from "./PortfolioLightbox";
import { InstagramEmbed } from "./InstagramEmbed";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { cn } from "@/lib/utils";

export function PublicPortfolioGrid({ items }: { items: PortfolioItemVM[] }) {
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  if (items.length === 0) return null;

  const imageItems = items.filter((it) => it.media_type === "image");

  return (
    <>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const isImage = item.media_type === "image";
          const isInstagram = item.media_type === "instagram_reel";
          const isYouTube = item.media_type.startsWith("youtube");
          const vertical = isVerticalMedia(item.media_type);

          const Icon = isImage ? ImageIcon : isInstagram ? Instagram : Youtube;
          const chipBg = isInstagram
            ? "bg-gradient-to-tr from-yellow-400 via-fuchsia-500 to-purple-600"
            : isYouTube
              ? "bg-red-600"
              : "bg-primary";

          return (
            <figure
              key={item.id}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm ring-1 ring-black/[0.02] transition-all duration-500",
                "hover:-translate-y-1 hover:shadow-xl hover:ring-primary/20",
              )}
            >
              <div className={cn("relative w-full overflow-hidden bg-neutral-900", vertical && !isInstagram ? "aspect-[9/16]" : !isInstagram ? "aspect-video" : "")}>
                {isInstagram && item.embed_url ? (
                  // Real Instagram embed — user clicks play inside the embed to watch inline
                  <InstagramEmbed
                    embedUrl={item.embed_url}
                    title={item.title}
                    interactive
                    className="rounded-none"
                  />
                ) : isYouTube && item.embed_url ? (
                  // YouTube click-to-play — replaces thumb with autoplaying iframe inline
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
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                    />
                  </button>
                ) : (
                  <div className="grid h-full w-full place-items-center text-white/40">
                    <Icon size={40} />
                  </div>
                )}

                {/* Type chip (skip on Instagram — its own embed already brands itself) */}
                {!isInstagram && (
                  <span
                    className={cn(
                      "pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur",
                      chipBg,
                    )}
                  >
                    <Icon size={12} className={isImage ? "" : "fill-current"} />
                    {isImage ? "Foto" : item.media_type === "youtube_short" ? "Shorts" : "YouTube"}
                  </span>
                )}
              </div>

              {(item.title || item.caption) && (
                <figcaption className="border-t border-border/50 bg-card px-4 py-3">
                  {item.title && (
                    <p className="line-clamp-1 text-sm font-bold text-foreground">{item.title}</p>
                  )}
                  {item.caption && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.caption}</p>
                  )}
                </figcaption>
              )}
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
