import { supabase } from "@/integrations/supabase/client";
import { ensureAppServiceWorker } from "@/lib/pwa/serviceWorker";

export const VAPID_PUBLIC_KEY =
  (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ??
  "BOZcz-1eZ395VP6rDgct7rdegqfp-UJNfokNlrn-8Q1JdHr4QYkVEuo2hkiav0DqbwC9UbKyTr7TFIqXNNRfchs";

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null) {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return window.btoa(binary);
}

export function describeDevice() {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? "Microsoft Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua) && !/Chromium/.test(ua)
        ? "Google Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Navegador";
  const platform = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS/.test(ua)
          ? "macOS"
          : "Desktop";
  return { browser, platform, label: `${browser} · ${platform}`, userAgent: ua.slice(0, 400) };
}

export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  try {
    const registration = await ensureAppServiceWorker();
    return registration.pushManager.getSubscription();
  } catch {
    // Dev, preview e navegadores bloqueados não registram o worker.
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), ms)),
  ]);
}

/**
 * Garante um service worker ativo para receber push.
 * O PWA e o Push compartilham a mesma promessa de registro para impedir
 * workers concorrentes e estados divergentes entre o banner e a Central.
 */
export async function ensurePushRegistration(): Promise<ServiceWorkerRegistration> {
  const registration = await ensureAppServiceWorker();
  if (!registration.active || !registration.pushManager) {
    throw new Error("O serviço de notificações não ficou disponível. Recarregue a página e tente de novo.");
  }

  return registration;
}

export async function subscribeCurrentDevice(userId: string) {
  if (!isPushSupported()) throw new Error("Este navegador não suporta notificações push.");

  // Confirma que o worker existe antes de pedir uma permissão persistente ao usuário.
  const registration = await ensurePushRegistration();
  const permission = await withTimeout(Notification.requestPermission(), 60_000);
  if (permission !== "granted") {
    throw new Error(
      permission === null
        ? "Tempo esgotado aguardando a permissão do navegador."
        : "Permissão de notificações negada.",
    );
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await withTimeout(
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }),
      20_000,
    );
  }
  if (!subscription) {
    throw new Error("O navegador não concluiu a inscrição de push. Tente novamente em alguns segundos.");
  }

  const device = describeDevice();
  const p256dh = arrayBufferToBase64(subscription.getKey("p256dh"));
  const auth = arrayBufferToBase64(subscription.getKey("auth"));
  if (!p256dh || !auth) {
    throw new Error("O navegador criou uma assinatura incompleta. Remova a permissão do site e tente novamente.");
  }
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session || sessionData.session.user.id !== userId) {
    throw new Error("Sua sessão expirou. Entre novamente antes de ativar as notificações.");
  }

  const { data: savedRows, error } = await supabase.rpc("register_my_push_subscription", {
    p_endpoint: subscription.endpoint,
    p_p256dh: p256dh,
    p_auth: auth,
    p_device_label: device.label,
    p_platform: device.platform,
    p_browser: device.browser,
    p_user_agent: device.userAgent,
  });
  if (error) throw error;
  const saved = savedRows?.[0];
  if (!saved || saved.status !== "active" || saved.endpoint !== subscription.endpoint) {
    throw new Error("A assinatura foi criada, mas o aparelho não foi confirmado no servidor.");
  }

  const verified = await registration.pushManager.getSubscription();
  if (!verified || verified.endpoint !== subscription.endpoint) {
    throw new Error("O navegador não manteve a assinatura de notificações. Tente novamente.");
  }

  window.dispatchEvent(new CustomEvent("gdf:push-subscription-changed"));

  return subscription.endpoint;
}

export async function unsubscribeCurrentDevice() {
  const subscription = await getExistingSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe().catch(() => {});
  await supabase.from("push_subscriptions").update({ status: "revoked" }).eq("endpoint", endpoint);
  window.dispatchEvent(new CustomEvent("gdf:push-subscription-changed"));
}

export type PushDevice = {
  id: string;
  device_label: string | null;
  platform: string | null;
  browser: string | null;
  endpoint: string;
  status: string;
  last_used_at: string | null;
  created_at: string;
};

export async function listMyDevices(userId: string): Promise<PushDevice[]> {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, device_label, platform, browser, endpoint, status, last_used_at, created_at")
    .eq("user_id", userId)
    .neq("status", "revoked")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PushDevice[];
}

export async function revokeDevice(id: string) {
  const { error } = await supabase.from("push_subscriptions").update({ status: "revoked" }).eq("id", id);
  if (error) throw error;
}

export async function sendTestPush() {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sessão expirada.");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-web-push`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      test: true,
      title: "Notificação de teste",
      message: "Se você recebeu este aviso, as notificações estão funcionando.",
      link: "/painel/notificacoes",
    }),
  });
  const result = (await response.json()) as { sent?: number; error?: string };
  if (!response.ok) throw new Error(result.error ?? "Falha ao enviar push de teste.");
  return result;
}

export type NotificationPreferences = {
  user_id: string;
  push_enabled: boolean;
  inapp_enabled: boolean;
  push_messages: boolean;
  push_quotes: boolean;
  push_proposals: boolean;
  push_reviews: boolean;
  push_subscription: boolean;
  push_moderation: boolean;
  push_system: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
};

export async function getPreferences(userId: string): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (
    (data as NotificationPreferences | null) ?? {
      user_id: userId,
      push_enabled: true,
      inapp_enabled: true,
      push_messages: true,
      push_quotes: true,
      push_proposals: true,
      push_reviews: true,
      push_subscription: true,
      push_moderation: true,
      push_system: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
    }
  );
}

export async function savePreferences(userId: string, patch: Partial<NotificationPreferences>) {
  const { error } = await supabase
    .from("notification_preferences")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  if (error) throw error;
}
