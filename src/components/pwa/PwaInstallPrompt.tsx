import { useEffect, useState } from "react";
import { Download, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { InstallInstructionsDialog } from "./InstallPwaButton";
import { toast } from "sonner";

/** Convite flutuante e discreto para instalar o app (mobile first). */
export function PwaInstallPrompt() {
  const { shouldSuggest, canPrompt, install, dismiss, platform } = usePwaInstall();
  const [visible, setVisible] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!shouldSuggest) return;
    const timer = window.setTimeout(() => setVisible(true), 8000);
    return () => window.clearTimeout(timer);
  }, [shouldSuggest]);

  if (!visible || !shouldSuggest) return null;

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
        className="fixed inset-x-3 bottom-3 z-[60] sm:left-auto sm:right-4 sm:w-[360px]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="rounded-2xl border border-primary/15 bg-card p-4 shadow-float">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Sparkles size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-sm font-extrabold text-foreground">Instale o Guia DF na Mídia</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Acesso rápido em tela cheia e alertas de mensagens, pedidos e vencimentos direto no seu dispositivo.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="rounded-full" onClick={handleInstall}>
                  <Download size={14} /> Instalar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => {
                    dismiss();
                    setVisible(false);
                  }}
                >
                  Agora não
                </Button>
              </div>
            </div>
            <button
              type="button"
              aria-label="Fechar convite de instalação"
              onClick={() => {
                dismiss();
                setVisible(false);
              }}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
      <InstallInstructionsDialog open={helpOpen} onOpenChange={setHelpOpen} platform={platform} />
    </>
  );
}
