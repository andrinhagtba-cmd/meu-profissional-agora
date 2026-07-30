import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { isStandalone } from "@/hooks/use-pwa-install";
import { isPreviewContext } from "@/lib/pwa/serviceWorker";

const DISMISS_KEY = "gdf:push-prompt-dismissed-at";
const DISMISS_DAYS = 7;

/** Convite para ativar notificações, exibido ao abrir o app instalado (PWA). */
export function PushEnablePrompt() {
  const { user } = useAuth();
  const { supported, permission, subscribedHere, loading, working, error, enable } = usePushNotifications();
  const [standalone, setStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isPreviewContext()) return;
    setStandalone(isStandalone());
    const raw = window.localStorage.getItem(DISMISS_KEY);
    const at = raw ? Number(raw) : 0;
    setDismissed(Boolean(at) && Date.now() - at < DISMISS_DAYS * 86_400_000);
  }, []);

  const eligible =
    standalone &&
    !dismissed &&
    !loading &&
    supported &&
    permission === "default" &&
    !subscribedHere &&
    Boolean(user?.id);

  useEffect(() => {
    if (!eligible) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 2500);
    return () => window.clearTimeout(timer);
  }, [eligible]);

  if (!visible || !eligible) return null;

  const close = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
    setVisible(false);
  };

  const handleEnable = async () => {
    const activated = await enable();
    if (activated) {
      toast.success("Notificações ativadas neste dispositivo!");
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
      setVisible(false);
    } else {
      toast.error("A permissão foi concedida, mas não foi possível registrar este aparelho. Tente novamente.");
    }
  };

  return (
    <div
      className="fixed inset-x-3 bottom-20 z-[61] animate-in fade-in slide-in-from-bottom-4 duration-500 sm:bottom-3 sm:left-auto sm:right-4 sm:w-[380px]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-primary via-primary to-orange p-[1.5px] shadow-[0_24px_60px_-20px_oklch(0.51_0.245_262/45%)]">
        <div className="relative overflow-hidden rounded-[25px] bg-gradient-to-br from-primary via-[oklch(0.48_0.22_268)] to-orange p-4 text-white">
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-orange/40 blur-3xl" />

          <button
            type="button"
            aria-label="Fechar convite de notificações"
            onClick={close}
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/15 text-white/80 backdrop-blur transition hover:bg-white/25 hover:text-white"
          >
            <X size={14} />
          </button>

          <div className="relative flex items-start gap-3 pr-8">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <Bell size={22} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-base font-extrabold leading-tight">Ative as notificações</p>
              <p className="mt-1 text-sm text-white/85">
                Receba avisos de mensagens, propostas e pedidos direto no seu celular.
              </p>
            </div>
          </div>

          <div className="relative mt-4 flex gap-2">
            <Button
              onClick={handleEnable}
              disabled={working}
              className="h-11 flex-1 rounded-xl bg-white font-semibold text-primary hover:bg-white/90"
            >
              {working ? "Ativando…" : "Ativar agora"}
            </Button>
            <Button
              variant="ghost"
              onClick={close}
              className="h-11 rounded-xl px-4 font-semibold text-white/85 hover:bg-white/15 hover:text-white"
            >
              Agora não
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
