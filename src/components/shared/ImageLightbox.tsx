import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";

/** Overlay premium para visualizar uma imagem ampliada. */
export function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/12 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/22"
      >
        <X size={20} />
      </button>
      <figure className="max-h-full w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          className="mx-auto max-h-[82vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
        />
        {alt && (
          <figcaption className="mt-3 text-center text-sm font-medium text-white/85">{alt}</figcaption>
        )}
      </figure>
    </div>,
    document.body,
  );
}

/**
 * Área de imagem clicável: mostra o conteúdo normalmente e abre a imagem
 * ampliada em overlay ao clicar.
 */
export function ZoomableImageArea({
  src,
  alt,
  className,
  style,
  children,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className} style={style}>
      {src && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          aria-label={`Ampliar imagem de ${alt}`}
          className="group/zoom absolute inset-0 z-[5] cursor-zoom-in"
        >
          <span className="pointer-events-none absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white opacity-0 shadow-sm backdrop-blur transition-opacity duration-200 group-hover/zoom:opacity-100">
            <Maximize2 size={14} />
          </span>
        </button>
      )}
      {children}
      {open && src && <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </div>
  );
}

/** Wrapper clicável para avatares e miniaturas. */
export function ZoomableThumb({
  src,
  alt,
  children,
  className,
}: {
  src?: string | null;
  alt: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!src) return <>{children}</>;
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Ampliar foto de ${alt}`}
        className={`cursor-zoom-in rounded-full transition hover:brightness-95 ${className ?? ""}`}
      >
        {children}
      </button>
      {open && <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
