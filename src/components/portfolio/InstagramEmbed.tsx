import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Instagram official /embed endpoint (no scraping, no script).
 * Renders inline. Never opens a new tab.
 *
 * `interactive={false}` disables pointer events so a parent overlay
 * (Play button opening the lightbox) can capture the click while the
 * iframe still paints the real Reel poster as a live thumbnail.
 */
export function InstagramEmbed({
  embedUrl,
  title,
  className,
  interactive = true,
}: {
  embedUrl: string;
  externalUrl?: string;
  title?: string | null;
  className?: string;
  interactive?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const src = embedUrl.includes("/captioned")
    ? embedUrl
    : embedUrl.replace(/\/?$/, "/captioned/");

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl bg-neutral-950",
        "aspect-[9/16]",
        className,
      )}
    >
      {!loaded && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur">
            <Play size={22} fill="currentColor" />
          </span>
        </div>
      )}
      <iframe
        src={src}
        title={title ?? "Instagram Reel"}
        className={cn(
          "h-full w-full border-0 transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          !interactive && "pointer-events-none",
        )}
        allow="autoplay; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setLoaded(true)}
        scrolling="no"
      />
    </div>
  );
}
