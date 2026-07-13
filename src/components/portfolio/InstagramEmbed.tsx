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
  bare = false,
}: {
  embedUrl: string;
  externalUrl?: string;
  title?: string | null;
  className?: string;
  interactive?: boolean;
  /** When true, strips Instagram's own header/footer chrome so the video fills the frame. */
  bare?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  // Bare mode: use /embed/ (no captioned card). Otherwise keep captioned.
  const normalized = embedUrl.replace(/\/captioned\/?$/, "/").replace(/\/?$/, "/");
  const src = bare ? normalized : (embedUrl.includes("/captioned") ? embedUrl : normalized + "captioned/");

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-neutral-950",
        "aspect-[9/16]",
        !bare && "rounded-2xl",
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
      {/* In bare mode we scale the iframe so IG's top bar / bottom actions get
          clipped by the container, leaving the video edge-to-edge. */}
      <iframe
        src={src}
        title={title ?? "Instagram Reel"}
        style={
          bare
            ? {
                position: "absolute",
                top: "-14%",
                left: "-6%",
                width: "112%",
                height: "132%",
                border: 0,
              }
            : undefined
        }
        className={cn(
          !bare && "h-full w-full border-0",
          "transition-opacity duration-500",
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

