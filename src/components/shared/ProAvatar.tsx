import { cn } from "@/lib/utils";

export function ProAvatar({
  initials,
  color,
  size = "md",
  className,
  imageUrl,
  alt,
}: {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  imageUrl?: string;
  alt?: string;
}) {
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl",
  };
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt ?? ""}
        className={cn(
          "inline-block shrink-0 rounded-full object-cover",
          sizes[size],
          className,
        )}
        loading="lazy"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold text-primary-foreground",
        color,
        sizes[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}
