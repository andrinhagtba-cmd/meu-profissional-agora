import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  getExistingSubscription,
  isPushSupported,
  listMyDevices,
  revokeDevice,
  subscribeCurrentDevice,
  unsubscribeCurrentDevice,
  type PushDevice,
} from "@/lib/push/pushClient";
import { isStandalone } from "@/hooks/use-pwa-install";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export function usePushNotifications() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<PushPermission>("unsupported");
  const [subscribedHere, setSubscribedHere] = useState(false);
  const [devices, setDevices] = useState<PushDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsInstall, setNeedsInstall] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const isSupported = isPushSupported();
      setSupported(isSupported);
      setPermission(isSupported ? (Notification.permission as PushPermission) : "unsupported");
      const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      setNeedsInstall(iOS && !isStandalone());

      const sub = isSupported ? await getExistingSubscription() : null;
      setSubscribedHere(Boolean(sub));

      if (user?.id) setDevices(await listMyDevices(user.id));
      else setDevices([]);
    } catch (e) {
      setError((e as Error).message);
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
    try {
      await subscribeCurrentDevice(user.id);
      await refresh();
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Não foi possível ativar as notificações.";
      setError(message);
      setPermission(isPushSupported() ? (Notification.permission as PushPermission) : "unsupported");
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

  return {
    supported,
    permission,
    subscribedHere,
    devices,
    loading,
    working,
    error,
    needsInstall,
    enable,
    disable,
    removeDevice,
    refresh,
  };
}
