import { useState } from "react";
import { Play, Instagram, Youtube, Image as ImageIcon } from "lucide-react";
import type { PortfolioItemVM } from "@/services/professionalMediaService";
import { isVerticalMedia } from "@/lib/portfolioUrls";
import { PortfolioLightbox } from "./PortfolioLightbox";
import { InstagramEmbed } from "./InstagramEmbed";
import { cn } from "@/lib/utils";

export function PublicPortfolioGrid({ items }: { items: PortfolioItemVM[] }) {
  const [index, setIndex] = useState<number | null>(null);
  if (items.length === 0) return null;

  return (
    <>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const isImage = item.media_type === "image";
          const isInstagram = item.media_type === "instagram_reel";
          const isYouTube = item.media_type.startsWith("youtube");
          const vertical = isVerticalMedia(item.media_type);
          const thumb = isImage ? item.url : item.thumbnail_url;

          const Icon = isImage ? ImageIcon : isInstagram ? Instagram : Youtube;
          const iconBg = isInstagram
            ? "bg-gradient-to-tr from-yellow-400 via-fuchsia-500 to-purple-600"
            : isYouTube
              ? "bg-red-600"
              : "bg-primary";

          return (
            <div
              key={item.id}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm ring-1 ring-black/[0.02] transition-all duration-500",
                "hover:-translate-y-1 hover:shadow-xl hover:ring-primary/20",
              )}
            >
              {/* Media area */}
              <div className={cn("relative w-full overflow-hidden bg-neutral-900", vertical ? "aspect-[9/16]" : "aspect-video")}>
                {isInstagram && !thumb ? (
                  // Live preview iframe — pointer-events blocked so overlay handles clicks
                  <InstagramEmbed
                    embedUrl={item.embed_url ?? ""}
                    title={item.title}
                    interactive={false}
                    className="rounded-none"
                  />
                ) : thumb ? (
                  <img
                    src={thumb}
                    alt={item.alt_text ?? item.title ?? ""}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-white/40">
                    <Icon size={40} />
                  </div>
                )}

                {/* Type chip */}
                <span
                  className={cn(
                    "absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur",
                    iconBg,
                  )}
                >
                  <Icon size={12} className={isImage ? "" : "fill-current"} />
                  {isImage ? "Foto" : isInstagram ? "Reels" : item.media_type === "youtube_short" ? "Shorts" : "YouTube"}
                </span>

                {/* Gradient scrim for title */}
                {(item.title || item.caption) && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-10">
                    {item.title && (
                      <p className="line-clamp-1 text-sm font-bold text-white drop-shadow">{item.title}</p>
                    )}
                    {item.caption && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-white/85">{item.caption}</p>
                    )}
                  </div>
                )}

                {/* Play overlay — click opens lightbox with inline playback */}
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Reproduzir ${item.title ?? "mídia"}`}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 opacity-100 transition-all duration-300 hover:bg-black/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {!isImage && (
                    <span
                      className={cn(
                        "grid h-16 w-16 place-items-center rounded-full bg-white/95 text-neutral-900 shadow-2xl ring-4 ring-white/25 transition-all duration-300",
                        "group-hover:scale-110 group-hover:ring-white/40",
                      )}
                    >
                      <Play size={26} className="ml-1 fill-current" />
                    </span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <PortfolioLightbox
        items={items}
        startIndex={index ?? 0}
        open={index !== null}
        onClose={() => setIndex(null)}
      />
    </>
  );
}
