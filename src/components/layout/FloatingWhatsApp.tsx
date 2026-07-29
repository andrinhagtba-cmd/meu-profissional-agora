import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/services/settingsService";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const FALLBACK_PHONE = "5561998662261";
const MESSAGE =
  "Olá! Quero divulgar minha empresa no Guia DF na Mídia. Pode me enviar os planos e valores?";

/** Botão flutuante premium de atendimento comercial via WhatsApp. */
export function FloatingWhatsApp() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const { data: settings } = useQuery({
    queryKey: ["public-settings-whatsapp"],
    queryFn: () => getSettings(false),
    staleTime: 5 * 60 * 1000,
  });

  const href =
    buildWhatsAppUrl(settings?.whatsapp ?? null, MESSAGE) ??
    buildWhatsAppUrl(FALLBACK_PHONE, MESSAGE)!;

  if (!mounted) return null;

  return (
    <div className="fixed bottom-5 right-4 z-50 flex items-end gap-2 sm:bottom-7 sm:right-6">
      {open && (
        <div className="relative max-w-[15rem] animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-border bg-card p-4 pr-8 shadow-xl">
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpen(false)}
            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition hover:bg-secondary"
          >
            <X size={14} />
          </button>
          <p className="font-display text-sm font-bold leading-tight text-foreground">
            Divulgue sua empresa aqui
          </p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            Atendimento premium: fale agora com nosso time comercial.
          </p>
        </div>
      )}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Divulgue sua empresa — falar no WhatsApp"
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl ring-4 ring-[#25D366]/20 transition hover:scale-105 hover:shadow-2xl"
      >
        <MessageCircle size={26} className="fill-white/15" aria-hidden="true" />
      </a>
    </div>
  );
}
