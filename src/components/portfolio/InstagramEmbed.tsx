import { useState } from "react";
import { Instagram, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Uses Instagram's official /embed endpoint (no scraping, no script).
 * Falls back to a link card if the iframe fails to load (private / removed).
 */
export function InstagramEmbed({
  embedUrl,
  externalUrl,
  title,
  className,
}: {
  embedUrl: string;
  externalUrl: string;
  title?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex aspect-[9/16] w-full flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-orange-500/10 p-6 text-center",
          className,
        )}
      >
        <Instagram size={36} className="text-pink-600" />
        <p className="font-semibold text-foreground">{title ?? "Publicação no Instagram"}</p>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
          Ver publicação no Instagram <ExternalLink size={14} />
        </span>
      </a>
    );
  }

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl bg-black", "aspect-[9/16]", className)}>
      <iframe
        src={embedUrl}
        title={title ?? "Instagram"}
        className="h-full w-full"
        allow="autoplay; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
