import { MapPin } from "lucide-react";
import { professionalPublicLocationParts } from "@/lib/proAddress";
import type { Professional } from "@/types";

interface Props {
  pro: Professional;
  size?: "sm" | "md";
  className?: string;
}

/** Exibição premium do endereço completo: pin em cápsula + linha principal e detalhes. */
export function ProLocationBlock({ pro, size = "md", className = "" }: Props) {
  const parts = professionalPublicLocationParts(pro);
  if (!parts) return null;
  const sm = size === "sm";

  return (
    <div
      className={`flex items-start gap-2 rounded-xl border border-border/70 bg-secondary/40 px-2.5 py-2 ${className}`}
    >
      <span
        className={`mt-0.5 inline-flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ${
          sm ? "size-5" : "size-6"
        }`}
        aria-hidden="true"
      >
        <MapPin size={sm ? 12 : 14} />
      </span>
      <span className="min-w-0">
        <span
          className={`block truncate font-semibold text-foreground ${sm ? "text-[12px]" : "text-[13px]"}`}
          title={[parts.primary, parts.secondary].filter(Boolean).join(" · ")}
        >
          {parts.primary}
        </span>
        {parts.secondary && (
          <span className={`block truncate text-muted-foreground ${sm ? "text-[11px]" : "text-xs"}`}>
            {parts.secondary}
          </span>
        )}
      </span>
    </div>
  );
}
