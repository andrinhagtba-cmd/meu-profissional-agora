import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Download, Monitor, RefreshCw, Smartphone, Wifi } from "lucide-react";
import { usePwa } from "@/components/pwa/PwaProvider";
import { detectPlatform, isStandalone, usePwaInstall } from "@/hooks/use-pwa-install";
import { InstallPwaButton } from "@/components/pwa/InstallPwaButton";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/use-online-status";

function browserName(ua: string) {
  if (/Edg\//.test(ua)) return "Microsoft Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Google Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "Navegador desconhecido";
}

const PLATFORM_LABEL: Record<string, string> = {
  ios: "iPhone / iPad",
  android: "Android",
  desktop: "Computador",
  unknown: "Não identificado",
};

export function PwaDiagnosticPanel() {
  const { registered, blockedReason, version, lastCheckedAt, updateAvailable, applyUpdate, registration } = usePwa();
  const { installed } = usePwaInstall();
  const { online } = useOnlineStatus();
  const [env, setEnv] = useState({ browser: "—", platform: "—", standalone: false, permission: "default" as string });

  useEffect(() => {
    setEnv({
      browser: browserName(navigator.userAgent),
      platform: PLATFORM_LABEL[detectPlatform()] ?? "—",
      standalone: isStandalone(),
      permission: "Notification" in window ? Notification.permission : "unsupported",
    });
  }, []);

  const swStatus = registered
    ? "Ativo"
    : blockedReason === "preview"
      ? "Desativado no preview"
      : blockedReason === "dev"
        ? "Desativado em desenvolvimento"
        : blockedReason === "unsupported"
          ? "Não suportado neste navegador"
          : "Registrando…";

  const pushStatus =
    env.permission === "granted"
      ? "Permitido"
      : env.permission === "denied"
        ? "Bloqueado pelo navegador"
        : env.permission === "unsupported"
          ? "Não suportado"
          : "Ainda não solicitado";

  return (
    <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-extrabold text-foreground">Aplicativo (PWA)</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Status da instalação, do service worker e das notificações neste dispositivo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <InstallPwaButton size="sm" className="rounded-full" />
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => registration?.update().catch(() => {})}
            disabled={!registration}
          >
            <RefreshCw size={14} /> Procurar atualização
          </Button>
          {updateAvailable && (
            <Button size="sm" className="rounded-full" onClick={applyUpdate}>
              Atualizar agora
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Item icon={<Download size={16} />} label="Versão do aplicativo" value={version} />
        <Item
          icon={registered ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
          label="Service Worker"
          value={swStatus}
          tone={registered ? "ok" : "warn"}
        />
        <Item
          icon={<Wifi size={16} />}
          label="Notificações push"
          value={pushStatus}
          tone={env.permission === "granted" ? "ok" : env.permission === "denied" ? "warn" : "neutral"}
        />
        <Item icon={<Monitor size={16} />} label="Navegador atual" value={env.browser} />
        <Item icon={<Smartphone size={16} />} label="Dispositivo atual" value={env.platform} />
        <Item
          icon={<CheckCircle2 size={16} />}
          label="Modo de execução"
          value={installed || env.standalone ? "Instalado (standalone)" : "Aba do navegador"}
        />
        <Item
          icon={<RefreshCw size={16} />}
          label="Última sincronização"
          value={lastCheckedAt ? new Date(lastCheckedAt).toLocaleString("pt-BR") : "—"}
        />
        <Item icon={<Wifi size={16} />} label="Conexão" value={online ? "Online" : "Offline"} tone={online ? "ok" : "warn"} />
      </div>

      {env.permission === "denied" && (
        <p className="mt-4 rounded-xl border border-orange/30 bg-orange/5 p-3 text-xs text-foreground">
          As notificações estão bloqueadas no navegador. Para ativar, altere a permissão nas configurações do site.
        </p>
      )}
    </section>
  );
}

function Item({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "ok" | "warn" | "neutral";
}) {
  const toneClass =
    tone === "ok" ? "bg-primary/10 text-primary" : tone === "warn" ? "bg-orange/10 text-orange" : "bg-muted text-muted-foreground";
  return (
    <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${toneClass}`}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 truncate font-display text-sm font-extrabold text-foreground">{value}</div>
    </div>
  );
}
