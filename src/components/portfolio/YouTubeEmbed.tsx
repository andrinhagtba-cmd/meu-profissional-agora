import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function YouTubeEmbed({
  embedUrl,
  thumbnailUrl,
  title,
  vertical,
  autoplay = true,
  className,
}: {
  embedUrl: string;
  thumbnailUrl?: string | null;
  title?: string | null;
  vertical?: boolean;
  autoplay?: boolean;
  className?: string;
}) {
  const [play, setPlay] = useState(false);
  const ratio = vertical ? "aspect-[9/16]" : "aspect-video";
  const src = play ? `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1` : "";

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl bg-black", ratio, className)}>
      {play ? (
        <iframe
          src={src}
          title={title ?? "YouTube"}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => autoplay && setPlay(true)}
          className="group relative block h-full w-full"
          aria-label={`Reproduzir vídeo${title ? `: ${title}` : ""}`}
        >
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title ?? ""} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full bg-neutral-900" />
          )}
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-red-600 shadow-lg transition group-hover:scale-105">
              <Play className="fill-current" size={26} />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
