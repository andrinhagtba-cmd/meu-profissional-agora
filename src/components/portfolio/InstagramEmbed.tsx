import { useState } from "react";
import { Instagram } from "lucide-react";
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
        "relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-500/20 via-purple-500/15 to-orange-500/15",
        "aspect-[9/16]",
        className,
      )}
    >
      {!loaded && (
        <div className="absolute inset-0 grid place-items-center">
          <Instagram className="text-white/80 animate-pulse" size={40} />
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
