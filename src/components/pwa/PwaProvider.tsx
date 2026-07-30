import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  applyServiceWorkerUpdate,
  canRegisterServiceWorker,
  isPreviewContext,
  registerAppServiceWorker,
} from "@/lib/pwa/serviceWorker";

export const PWA_VERSION = (import.meta.env.VITE_PWA_VERSION as string | undefined) ?? "1.0.0";

type PwaContextValue = {
  supported: boolean;
  registered: boolean;
  blockedReason: "unsupported" | "preview" | "dev" | null;
  updateAvailable: boolean;
  version: string;
  lastCheckedAt: string | null;
  registration: ServiceWorkerRegistration | null;
  applyUpdate: () => void;
  dismissUpdate: () => void;
};

const PwaContext = createContext<PwaContextValue | null>(null);

export function usePwa() {
  const ctx = useContext(PwaContext);
  if (!ctx) throw new Error("usePwa deve ser usado dentro de <PwaProvider>");
  return ctx;
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [blockedReason, setBlockedReason] = useState<PwaContextValue["blockedReason"]>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!canRegisterServiceWorker()) {
      setBlockedReason(
        typeof navigator === "undefined" || !("serviceWorker" in navigator)
          ? "unsupported"
          : isPreviewContext()
            ? "preview"
            : "dev",
      );
      return;
    }

    registerAppServiceWorker((reg) => {
      setRegistration(reg);
      setUpdateAvailable(true);
    })
      .then(({ registration: reg, reason }) => {
        if (reg) setRegistration(reg);
        if (reason) setBlockedReason(reason);
        setLastCheckedAt(new Date().toISOString());
      })
      .catch(() => setBlockedReason("unsupported"));
  }, []);

  // Deep link vindo do clique em uma notificação push.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "NOTIFICATION_CLICK" || !event.data.url) return;
      try {
        const url = new URL(event.data.url);
        if (url.origin !== window.location.origin) return;
        navigate({ to: url.pathname + url.search + url.hash });
      } catch {
        /* url inválida — ignora */
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [navigate]);

  const applyUpdate = useCallback(() => {
    if (registration) applyServiceWorkerUpdate(registration);
  }, [registration]);

  const value = useMemo<PwaContextValue>(
    () => ({
      supported: typeof navigator !== "undefined" && "serviceWorker" in navigator,
      registered: Boolean(registration),
      blockedReason,
      updateAvailable,
      version: PWA_VERSION,
      lastCheckedAt,
      registration,
      applyUpdate,
      dismissUpdate: () => setUpdateAvailable(false),
    }),
    [applyUpdate, blockedReason, lastCheckedAt, registration, updateAvailable],
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}
