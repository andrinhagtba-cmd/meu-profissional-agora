import { useEffect, useState } from "react";
import { Download, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useBrand } from "@/hooks/use-brand";
import { InstallInstructionsDialog } from "./InstallPwaButton";
import { toast } from "sonner";

/** Convite flutuante e premium para instalar o app (mobile first). */
export function PwaInstallPrompt() {
  const { shouldSuggest, canPrompt, install, dismiss, platform } = usePwaInstall();
  const { data: brand } = useBrand();
  const [visible, setVisible] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!shouldSuggest) return;
    const timer = window.setTimeout(() => setVisible(true), 8000);
    return () => window.clearTimeout(timer);
  }, [shouldSuggest]);

  if (!visible || !shouldSuggest) return null;

  const appName = brand?.pwa_name || brand?.brand_name || "Guia DF na Mídia";
  const iconUrl = brand?.pwa_icon_url || brand?.favicon_url || brand?.logo_light_url || null;

  const handleInstall = async () => {
    if (canPrompt) {
      const outcome = await install();
      if (outcome === "accepted") toast.success("Aplicativo instalado com sucesso!");
      setVisible(false);
      return;
    }
    setHelpOpen(true);
  };

  return (
    <>
      <div
        className="fixed inset-x-3 bottom-20 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-500 sm:bottom-3 sm:left-auto sm:right-4 sm:w-[380px]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-primary via-primary to-orange p-[1.5px] shadow-[0_24px_60px_-20px_oklch(0.51_0.245_262/45%)]">
          <div className="relative overflow-hidden rounded-[25px] bg-gradient-to-br from-primary via-[oklch(0.48_0.22_268)] to-orange p-4 text-white">
            {/* brilhos decorativos */}
            <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-orange/40 blur-3xl" />

            <button
              type="button"
              aria-label="Fechar convite de instalação"
              onClick={() => {
                dismiss();
                setVisible(false);
              }}
              className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/15 text-white/80 backdrop-blur transition hover:bg-white/25 hover:text-white"
            >
              <X size={14} />
            </button>

            <div className="relative flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/95 shadow-lg shadow-black/10 ring-1 ring-white/40">
                {iconUrl ? (
                  <img src={iconUrl} alt={appName} className="h-full w-full object-contain p-1.5" />
                ) : (
                  <Sparkles size={20} className="text-primary" />
                )}
              </span>
              <div className="min-w-0 flex-1 pr-6">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/90 backdrop-blur">
                  Aplicativo
                </span>
                <h3 className="mt-1.5 font-display text-[15px] font-extrabold leading-tight text-white">
                  Instale o {appName}
                </h3>
                <p className="mt-1 text-xs leading-5 text-white/80">
                  Acesso rápido em tela cheia e alertas de mensagens, pedidos e vencimentos direto no seu dispositivo.
                </p>
              </div>
            </div>

            <div className="relative mt-4 flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                className="h-9 flex-1 rounded-full bg-white font-bold text-primary shadow-lg shadow-black/10 hover:bg-white/90"
              >
                <Download size={15} /> Instalar agora
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 rounded-full px-4 text-white/85 hover:bg-white/15 hover:text-white"
                onClick={() => {
                  dismiss();
                  setVisible(false);
                }}
              >
                Agora não
              </Button>
            </div>
          </div>
        </div>
      </div>
      <InstallInstructionsDialog open={helpOpen} onOpenChange={setHelpOpen} platform={platform} />
    </>
  );
}
