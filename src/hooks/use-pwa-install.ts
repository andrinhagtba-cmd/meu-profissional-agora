import { useCallback, useEffect, useState } from "react";
import { isPreviewContext } from "@/lib/pwa/serviceWorker";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "gdf:pwa-install-dismissed-at";
const DISMISS_DAYS = 14;

export type Platform = "android" | "ios" | "desktop" | "unknown";

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [preview, setPreview] = useState(true);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());
    setPreview(isPreviewContext());

    const raw = window.localStorage.getItem(DISMISS_KEY);
    const dismissedAt = raw ? Number(raw) : 0;
    setDismissed(Boolean(dismissedAt) && Date.now() - dismissedAt < DISMISS_DAYS * 86_400_000);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return "unavailable" as const;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
    return outcome;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }, []);

  const resetDismiss = useCallback(() => {
    window.localStorage.removeItem(DISMISS_KEY);
    setDismissed(false);
  }, []);

  return {
    canPrompt: Boolean(deferredPrompt),
    installed,
    dismissed,
    platform,
    preview,
    /** true quando faz sentido exibir o convite flutuante */
    shouldSuggest: !installed && !dismissed && !preview,
    install,
    dismiss,
    resetDismiss,
  };
}
