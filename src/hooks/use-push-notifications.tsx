import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  getExistingSubscription,
  isPushSupported,
  listMyDevices,
  repairCurrentPwaDevice,
  revokeDevice,
  sendTestPush,
  subscribeCurrentDevice,
  unsubscribeCurrentDevice,
  VAPID_PUBLIC_KEY,
  type PushDevice,
} from "@/lib/push/pushClient";
import {
  ensureAppServiceWorker,
  pwaLog,
  subscribePwaLogs,
  updateAppServiceWorker,
  type PwaLogEntry,
} from "@/lib/pwa/serviceWorker";
import { isStandalone } from "@/hooks/use-pwa-install";

export type PushNotificationStatus = "loading" | "unsupported" | "permission-default" | "permission-denied" | "service-worker-error" | "permission-granted-not-subscribed" | "subscribing" | "subscribed-not-saved" | "subscribed" | "database-error";

type PushContextValue = ReturnType<typeof usePushNotificationsState>;
const PushContext = createContext<PushContextValue | null>(null);

function usePushNotificationsState() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [status, setStatus] = useState<PushNotificationStatus>("loading");
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registeredDevice, setRegisteredDevice] = useState<PushDevice | null>(null);
  const [devices, setDevices] = useState<PushDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [lastAttemptAt, setLastAttemptAt] = useState<string | null>(null);
  const [logs, setLogs] = useState<PwaLogEntry[]>([]);

  useEffect(() => subscribePwaLogs(setLogs), []);



  const refresh = useCallback(async () => {
    setLoading(true);
    setStatus("loading");
    setError(null);
    try {
      const isSupported = isPushSupported();
      setSupported(isSupported);
      setPermission(isSupported ? Notification.permission : "unsupported");
      if (!isSupported) {
        setStatus("unsupported");
        return;
      }
      const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      setNeedsInstall(iOS && !isStandalone());
      if (Notification.permission === "denied") {
        setStatus("permission-denied");
        return;
      }
      const nextRegistration = await ensureAppServiceWorker();
      if (!nextRegistration.active) throw new Error("O Service Worker foi registrado, mas ainda não está ativo.");
      setRegistration(nextRegistration);
      const sub = await nextRegistration.pushManager.getSubscription();
      setSubscription(sub);
      const nextDevices = user?.id ? await listMyDevices(user.id) : [];
      setDevices(nextDevices);
      const matching = sub ? nextDevices.find((device) => device.status === "active" && device.endpoint === sub.endpoint) ?? null : null;
      setRegisteredDevice(matching);
      if (Notification.permission === "default") setStatus("permission-default");
      else if (!sub) setStatus("permission-granted-not-subscribed");
      else if (!matching) setStatus("subscribed-not-saved");
      else setStatus("subscribed");
    } catch (e) {
      setError((e as Error).message);
      setStatus("service-worker-error");
      setRegistration(null);
      setSubscription(await getExistingSubscription());
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const sync = () => void refresh();
    window.addEventListener("gdf:push-subscription-changed", sync);
    return () => window.removeEventListener("gdf:push-subscription-changed", sync);
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!user?.id) return false;
    setWorking(true);
    setError(null);
    setLastAttemptAt(new Date().toISOString());
    setStatus("subscribing");
    try {
      await subscribeCurrentDevice(user.id);
      await refresh();
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Não foi possível ativar as notificações.";
      setError(message);
      setPermission(isPushSupported() ? Notification.permission : "unsupported");
      setStatus(Notification.permission === "denied" ? "permission-denied" : "database-error");
      return false;
    } finally {
      setWorking(false);
    }
  }, [refresh, user?.id]);

  const disable = useCallback(async () => {
    setWorking(true);
    setError(null);
    try {
      await unsubscribeCurrentDevice();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(false);
    }
  }, [refresh]);

  const removeDevice = useCallback(
    async (id: string) => {
      setWorking(true);
      try {
        await revokeDevice(id);
        await refresh();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setWorking(false);
      }
    },
    [refresh],
  );

  const repairPwa = useCallback(async () => {
    setWorking(true);
    setError(null);
    setLastAttemptAt(new Date().toISOString());
    try {
      await repairCurrentPwaDevice();
      window.location.reload();
    } catch (e) {
      setError((e as Error).message);
      setWorking(false);
    }
  }, []);

  const isFullyEnabled = permission === "granted" && Boolean(registration?.active) && Boolean(subscription) && registeredDevice?.status === "active" && registeredDevice.endpoint === subscription?.endpoint;

  return {
    supported,
    status,
    permission,
    registration,
    subscription,
    registeredDevice,
    isFullyEnabled,
    subscribedHere: isFullyEnabled,
    devices,
    loading,
    working,
    error,
    needsInstall,
    lastAttemptAt,
    vapidLoaded: Boolean(VAPID_PUBLIC_KEY.trim() && /^[A-Za-z0-9_-]+$/.test(VAPID_PUBLIC_KEY.trim())),
    enable,
    disable,
    removeDevice,
    refresh,
    sendTest: sendTestPush,
    repairPwa,
  };
}

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const state = usePushNotificationsState();
  const value = useMemo(() => state, [state]);
  return <PushContext.Provider value={value}>{children}</PushContext.Provider>;
}

export function usePushNotifications() {
  const context = useContext(PushContext);
  if (!context) throw new Error("usePushNotifications deve ser usado dentro de PushNotificationsProvider.");
  return context;
}
