import { Image as ImageIcon, Instagram, Youtube } from "lucide-react";
import type { PortfolioMediaType } from "@/services/professionalMediaService";
import { cn } from "@/lib/utils";

const CONFIG: Record<
  PortfolioMediaType,
  { label: string; Icon: typeof ImageIcon; className: string }
> = {
  image: {
    label: "Imagem",
    Icon: ImageIcon,
    className: "bg-primary/10 text-primary",
  },
  instagram_reel: {
    label: "Reels",
    Icon: Instagram,
    className: "bg-pink-500/15 text-pink-600",
  },
  youtube_video: {
    label: "YouTube",
    Icon: Youtube,
    className: "bg-red-500/15 text-red-600",
  },
  youtube_short: {
    label: "Short",
    Icon: Youtube,
    className: "bg-red-500/15 text-red-600",
  },
};

export function MediaTypeBadge({
  type,
  className,
}: {
  type: PortfolioMediaType;
  className?: string;
}) {
  const c = CONFIG[type];
  const Icon = c.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        c.className,
        className,
      )}
    >
      <Icon size={12} />
      {c.label}
    </span>
  );
}
