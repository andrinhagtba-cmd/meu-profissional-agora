import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ExternalLink } from "lucide-react";
import type { PortfolioItemVM } from "@/services/professionalMediaService";
import { isVerticalMedia } from "@/lib/portfolioUrls";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { InstagramEmbed } from "./InstagramEmbed";
import { cn } from "@/lib/utils";

interface Props {
  items: PortfolioItemVM[];
  startIndex: number;
  open: boolean;
  onClose: () => void;
}

export function PortfolioLightbox({ items, startIndex, open, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => setIndex(startIndex), [startIndex, open]);
  useEffect(() => setZoom(1), [index]);

  const total = items.length;
  const canNav = total > 1;
  const current = items[index];

  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && canNav) next();
      else if (e.key === "ArrowLeft" && canNav) prev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, canNav, next, prev, onClose]);

  if (!open || !current) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) && canNav) {
      dx < 0 ? next() : prev();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.title ?? "Portfólio"}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="min-w-0 text-sm">
          <p className="truncate font-semibold">{current.title || "Trabalho"}</p>
          {canNav && (
            <p className="text-xs text-white/70">
              {index + 1} de {total}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {current.external_url && (
            <a
              href={current.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
              aria-label="Abrir publicação original"
            >
              <ExternalLink size={18} />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-2 sm:px-8"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {canNav && (
          <button
            type="button"
            onClick={prev}
            aria-label="Anterior"
            className="absolute left-2 z-10 hidden h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:grid"
          >
            <ChevronLeft size={26} />
          </button>
        )}

        <div className={cn("flex h-full w-full items-center justify-center", "max-h-[85vh]")}>
          {current.media_type === "image" ? (
            <img
              key={current.id}
              src={current.url}
              alt={current.alt_text ?? current.title ?? ""}
              onDoubleClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
              className="max-h-full max-w-full cursor-zoom-in select-none object-contain transition-transform"
              style={{ transform: `scale(${zoom})` }}
              draggable={false}
            />
          ) : current.media_type === "instagram_reel" ? (
            <div className="h-full max-h-[85vh] w-full max-w-md">
              <InstagramEmbed
                embedUrl={current.embed_url ?? ""}
                externalUrl={current.external_url ?? ""}
                title={current.title}
              />
            </div>
          ) : (
            <div
              className={cn(
                "w-full",
                isVerticalMedia(current.media_type)
                  ? "h-full max-h-[85vh] max-w-md"
                  : "max-w-5xl",
              )}
            >
              <YouTubeEmbed
                embedUrl={current.embed_url ?? ""}
                thumbnailUrl={current.thumbnail_url}
                title={current.title}
                vertical={isVerticalMedia(current.media_type)}
                autoplay
              />
            </div>
          )}
        </div>

        {canNav && (
          <button
            type="button"
            onClick={next}
            aria-label="Próximo"
            className="absolute right-2 z-10 hidden h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:grid"
          >
            <ChevronRight size={26} />
          </button>
        )}
      </div>

      {(current.caption || current.description) && (
        <div className="mx-auto max-w-2xl px-4 pb-4 pt-2 text-center text-sm text-white/85">
          {current.caption || current.description}
        </div>
      )}
    </div>
  );
}
