import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  size = 14,
  showValue = true,
  className,
}: {
  rating: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="inline-flex" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={
              i < Math.round(rating) ? "fill-rating text-rating" : "fill-muted text-muted"
            }
          />
        ))}
      </span>
      {showValue && (
        <span className="text-sm font-semibold text-foreground">
          {rating.toFixed(1).replace(".", ",")}
        </span>
      )}
      <span className="sr-only">Avaliação {rating.toFixed(1)} de 5</span>
    </span>
  );
}
