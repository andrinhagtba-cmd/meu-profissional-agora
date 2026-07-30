import { useState } from "react";
import { Download, Share, MoreVertical, Plus, Smartphone, Monitor, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { toast } from "sonner";

type Props = {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  label?: string;
};

export function InstallPwaButton({ className, variant = "default", size = "default", label = "Instalar aplicativo" }: Props) {
  const { canPrompt, installed, install, platform, preview } = usePwaInstall();
  const [helpOpen, setHelpOpen] = useState(false);

  if (installed) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
        <CheckCircle2 size={14} /> Aplicativo instalado
      </span>
    );
  }

  const handleClick = async () => {
    if (preview) {
      toast.info("A instalação só funciona no site publicado, fora do preview.");
      return;
    }
    if (canPrompt) {
      const outcome = await install();
      if (outcome === "accepted") toast.success("Aplicativo instalado com sucesso!");
      return;
    }
    setHelpOpen(true);
  };

  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={handleClick}>
        <Download size={16} /> {label}
      </Button>
      <InstallInstructionsDialog open={helpOpen} onOpenChange={setHelpOpen} platform={platform} />
    </>
  );
}

export function InstallInstructionsDialog({
  open,
  onOpenChange,
  platform,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  platform: "android" | "ios" | "desktop" | "unknown";
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Como instalar o aplicativo</DialogTitle>
          <DialogDescription>
            Seu navegador não oferece o botão automático de instalação. Siga o passo a passo abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {platform === "ios" ? (
            <Steps
              icon={<Smartphone size={16} />}
              title="iPhone e iPad (Safari)"
              steps={[
                <>Toque no botão <Share size={13} className="inline" /> <strong>Compartilhar</strong> na barra do Safari.</>,
                <>Role a lista e toque em <strong>Adicionar à Tela de Início</strong>.</>,
                <>Confirme em <strong>Adicionar</strong>. O ícone aparece na tela inicial.</>,
              ]}
            />
          ) : platform === "android" ? (
            <Steps
              icon={<Smartphone size={16} />}
              title="Android (Chrome)"
              steps={[
                <>Toque no menu <MoreVertical size={13} className="inline" /> no canto superior direito.</>,
                <>Escolha <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</>,
                <>Confirme em <strong>Instalar</strong>.</>,
              ]}
            />
          ) : (
            <Steps
              icon={<Monitor size={16} />}
              title="Computador (Chrome, Edge, Brave)"
              steps={[
                <>Clique no ícone <Plus size={13} className="inline" /> de instalação na barra de endereço.</>,
                <>Ou abra o menu do navegador e escolha <strong>Instalar Guia DF na Mídia</strong>.</>,
                <>Confirme em <strong>Instalar</strong>.</>,
              ]}
            />
          )}
          <p className="rounded-xl border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
            Depois de instalado, o aplicativo abre em tela cheia e pode receber notificações no seu dispositivo.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Steps({ icon, title, steps }: { icon: React.ReactNode; title: string; steps: React.ReactNode[] }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background p-4">
      <div className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold text-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        {title}
      </div>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2 text-muted-foreground">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {i + 1}
            </span>
            <span className="leading-5">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
