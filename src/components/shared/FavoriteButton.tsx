import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(slug);

  return (
    <button
      type="button"
      aria-label={active ? `Remover ${name} dos favoritos` : `Salvar ${name} nos favoritos`}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggleFavorite(slug);
        toast.success(added ? `${name} salvo nos favoritos` : `${name} removido dos favoritos`);
      }}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring",
        className,
      )}
    >
      <Heart
        size={18}
        className={cn("transition-colors", active ? "fill-orange text-orange" : "text-muted-foreground")}
      />
    </button>
  );
}
