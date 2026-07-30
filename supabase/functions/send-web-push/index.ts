import webpush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contato@guiadfnamidia.com.br";
const PUSH_HOOK_SECRET = Deno.env.get("PUSH_HOOK_SECRET") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-push-secret",
};

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

type Body = {
  notificationId?: string;
  userId?: string;
  title?: string;
  message?: string;
  link?: string;
  type?: string;
  priority?: string;
  test?: boolean;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authorize(req: Request, body: Body): Promise<{ ok: boolean; userId?: string; reason?: string }> {
  // 1) Disparo automático vindo do banco (trigger via pg_net)
  const hookSecret = req.headers.get("x-push-secret");
  if (PUSH_HOOK_SECRET && hookSecret === PUSH_HOOK_SECRET) return { ok: true };

  // 2) Usuário autenticado enviando um push de teste para si mesmo
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return { ok: false, reason: "missing credentials" };

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return { ok: false, reason: "invalid token" };
  if (!body.test) return { ok: false, reason: "only test pushes allowed for users" };
  return { ok: true, userId: data.user.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const auth = await authorize(req, body);
    if (!auth.ok) return json({ error: auth.reason ?? "unauthorized" }, 401);

    let userId = auth.userId ?? body.userId ?? null;
    let notificationId: string | null = body.notificationId ?? null;
    let title = body.title ?? "Guia DF na Mídia";
    let message = body.message ?? "";
    let link = body.link ?? "/painel/notificacoes";
    let priority = body.priority ?? "normal";
    let type = body.type ?? "system";

    if (notificationId) {
      const { data: notif, error } = await admin
        .from("notifications")
        .select("id, user_id, title, message, link, type, priority")
        .eq("id", notificationId)
        .maybeSingle();
      if (error) throw error;
      if (!notif) return json({ error: "notification not found" }, 404);
      userId = notif.user_id;
      title = notif.title;
      message = notif.message ?? "";
      link = notif.link ?? "/painel/notificacoes";
      priority = notif.priority ?? "normal";
      type = notif.type ?? "system";
    }

    if (!userId) return json({ error: "userId or notificationId required" }, 400);

    const { data: subs, error: subsError } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId)
      .eq("status", "active");
    if (subsError) throw subsError;

    if (!subs || subs.length === 0) {
      if (notificationId) {
        await admin.from("notifications").update({ push_status: "no_device" }).eq("id", notificationId);
      }
      return json({ sent: 0, failed: 0, devices: 0 });
    }

    const { count: unreadCount } = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    const payload = JSON.stringify({
      title,
      body: message,
      actionUrl: link,
      notificationId,
      priority,
      type,
      unreadCount: unreadCount ?? 0,
    });

    let sent = 0;
    let failed = 0;

    await Promise.all(
      subs.map(async (sub) => {
        const subscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };
        try {
          await webpush.sendNotification(subscription, payload, {
            TTL: 60 * 60 * 24,
            urgency: priority === "urgent" || priority === "high" ? "high" : "normal",
          });
          sent += 1;
          await admin
            .from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString(), failure_count: 0, last_error: null })
            .eq("id", sub.id);
          await admin.from("notification_deliveries").insert({
            notification_id: notificationId,
            user_id: userId,
            subscription_id: sub.id,
            endpoint: sub.endpoint,
            status: "sent",
            http_status: 201,
          });
        } catch (err) {
          failed += 1;
          const statusCode = (err as { statusCode?: number }).statusCode ?? null;
          const messageText = (err as Error).message ?? "erro desconhecido";
          const gone = statusCode === 404 || statusCode === 410;

          await admin
            .from("push_subscriptions")
            .update(
              gone
                ? { status: "expired", last_error: messageText }
                : { failure_count: 1, last_error: messageText },
            )
            .eq("id", sub.id);

          await admin.from("notification_deliveries").insert({
            notification_id: notificationId,
            user_id: userId,
            subscription_id: sub.id,
            endpoint: sub.endpoint,
            status: gone ? "expired" : "failed",
            http_status: statusCode,
            error: messageText,
          });
        }
      }),
    );

    if (notificationId) {
      await admin
        .from("notifications")
        .update({ push_status: sent > 0 ? "sent" : "failed" })
        .eq("id", notificationId);
    }

    return json({ sent, failed, devices: subs.length });
  } catch (error) {
    console.error("send-web-push error", error);
    return json({ error: (error as Error).message }, 500);
  }
});
