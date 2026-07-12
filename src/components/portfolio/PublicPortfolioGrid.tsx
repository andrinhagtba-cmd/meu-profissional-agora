import { useState } from "react";
import { Play, Instagram, Youtube } from "lucide-react";
import type { PortfolioItemVM } from "@/services/professionalMediaService";
import { isVerticalMedia } from "@/lib/portfolioUrls";
import { PortfolioLightbox } from "./PortfolioLightbox";
import { cn } from "@/lib/utils";

export function PublicPortfolioGrid({ items }: { items: PortfolioItemVM[] }) {
  const [index, setIndex] = useState<number | null>(null);
  if (items.length === 0) return null;

  return (
    <>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const isImage = item.media_type === "image";
          const thumb = isImage ? item.url : item.thumbnail_url;
          const vertical = isVerticalMedia(item.media_type);
          const Icon = item.media_type === "image" ? null : item.media_type === "instagram_reel" ? Instagram : Youtube;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border bg-card text-left",
                vertical ? "aspect-[9/16]" : "aspect-video",
              )}
              aria-label={`Abrir ${item.title ?? "item"}`}
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt={item.alt_text ?? item.title ?? ""}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-white/70">
                  {Icon && <Icon size={36} />}
                </div>
              )}
              {!isImage && (
                <span className="absolute inset-0 grid place-items-center bg-black/25 transition group-hover:bg-black/15">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-red-600 shadow-lg">
                    <Play size={22} className="fill-current" />
                  </span>
                </span>
              )}
              {Icon && (
                <span className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white">
                  <Icon size={14} />
                </span>
              )}
              {(item.title || item.caption) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  {item.title && <p className="text-sm font-semibold text-white line-clamp-1">{item.title}</p>}
                  {item.caption && <p className="text-xs text-white/85 line-clamp-1">{item.caption}</p>}
                </div>
              )}
            </button>
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
