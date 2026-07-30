import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwa } from "./PwaProvider";

/** Aviso de nova versão — só recarrega após confirmação do usuário. */
export function PwaUpdatePrompt() {
  const { updateAvailable, applyUpdate, dismissUpdate } = usePwa();
  if (!updateAvailable) return null;

  return (
    <div
      className="fixed inset-x-3 top-3 z-[70] sm:left-auto sm:right-4 sm:w-[380px]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
      role="status"
    >
      <div className="rounded-2xl border border-primary/20 bg-card p-4 shadow-float">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <RefreshCw size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-sm font-extrabold text-foreground">
              Uma nova versão do aplicativo está disponível.
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Atualize para receber as últimas melhorias. Nada do que você já enviou será perdido.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="rounded-full" onClick={applyUpdate}>
                Atualizar agora
              </Button>
              <Button size="sm" variant="ghost" className="rounded-full" onClick={dismissUpdate}>
                Depois
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
