import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Instagram official /embed endpoint (no scraping, no script).
 * Renders inline. Never opens a new tab.
 *
 * The iframe fills its parent 1:1 — no cropping, no offsets — so whatever
 * aspect ratio the caller sets for the container is respected end-to-end
 * and Instagram's native Reel poster/player fits fully inside the mockup.
 */
export function InstagramEmbed({
  embedUrl,
  title,
  className,
  interactive = true,
  captioned = false,
  fit = "contain",
}: {
  embedUrl: string;
  externalUrl?: string;
  title?: string | null;
  className?: string;
  interactive?: boolean;
  /** When true uses Instagram's captioned card (with IG header/footer). */
  captioned?: boolean;
  /** Cover zoom hides Instagram's native side letterboxing inside vertical previews. */
  fit?: "contain" | "cover";
}) {
  const [loaded, setLoaded] = useState(false);
  const base = embedUrl.replace(/\/captioned\/?$/, "/").replace(/\/?$/, "/");
  const src = captioned ? base + "captioned/" : base;

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-neutral-950", className)}>
      {!loaded && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur">
            <Play size={22} fill="currentColor" />
          </span>
        </div>
      )}
      <iframe
        src={src}
        title={title ?? "Instagram Reel"}
        className={cn(
          "absolute border-0 transition-opacity duration-500",
          fit === "cover" ? "max-w-none" : "inset-0 h-full w-full",
          loaded ? "opacity-100" : "opacity-0",
          !interactive && "pointer-events-none",
        )}
        /**
         * Cover mode crops Instagram's chrome (header, actions, comment bar) so
         * only the reel video fills the container. Measured on the official
         * /embed markup: at iframe width W the video occupies 0.7025W wide,
         * 1.2475W tall, starting 0.135W from the top and horizontally centered.
         */
        style={
          fit === "cover"
            ? {
                width: "146.6%",
                aspectRatio: "400 / 700",
                left: "-23.3%",
                top: 0,
                transform: "translateY(-7.72%)",
              }
            : undefined
        }
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
