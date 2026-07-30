import { supabase } from "@/integrations/supabase/client";

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
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

export async function subscribeCurrentDevice(userId: string) {
  if (!isPushSupported()) throw new Error("Este navegador não suporta notificações push.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permissão de notificações negada.");

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const device = describeDevice();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
      auth: arrayBufferToBase64(subscription.getKey("auth")),
      device_label: device.label,
      platform: device.platform,
      browser: device.browser,
      user_agent: device.userAgent,
      status: "active",
      failure_count: 0,
      last_error: null,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  if (error) throw error;

  return subscription.endpoint;
}

export async function unsubscribeCurrentDevice() {
  const subscription = await getExistingSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe().catch(() => {});
  await supabase.from("push_subscriptions").update({ status: "revoked" }).eq("endpoint", endpoint);
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
    }
  );
}

export async function savePreferences(userId: string, patch: Partial<NotificationPreferences>) {
  const { error } = await supabase
    .from("notification_preferences")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  if (error) throw error;
}
