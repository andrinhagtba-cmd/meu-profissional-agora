import { supabase } from "@/integrations/supabase/client";
import { derivedStatus, monthlyValue, type DerivedStatus } from "@/lib/subscriptionStatus";

export type SubscriptionRow = {
  id: string;
  status: string;
  started_at: string | null;
  activated_at: string | null;
  expires_at: string | null;
  grace_period_end: string | null;
  cancelled_at: string | null;
  suspended_at: string | null;
  renewed_at: string | null;
  amount: number | null;
  payment_status: string;
  payment_method: string | null;
  auto_renew: boolean;
  notes: string | null;
  created_at: string;
  plan_id: string;
  professional_id: string;
  plan: { id: string; name: string; price: number; billing_period: string } | null;
  professional: {
    id: string;
    slug: string | null;
    professional_name: string | null;
    business_name: string | null;
    whatsapp: string | null;
    city: string | null;
    state: string | null;
    profile_status: string;
    user_id: string | null;
    avatar_media_id: string | null;
  } | null;
  // enriquecido
  avatar_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  last_notification: { offset_days: number; created_at: string; channel: string } | null;
  derived: DerivedStatus;
};

export type SubscriptionMetrics = {
  total: number;
  active: number;
  due30: number;
  due15: number;
  due7: number;
  dueToday: number;
  expired: number;
  suspended: number;
  cancelled: number;
  deactivated: number;
  pending: number;
  mrr: number;
  arr: number;
  activeWithoutPlan: number;
  notNotified: number;
};

const SELECT =
  "id, status, started_at, activated_at, expires_at, grace_period_end, cancelled_at, suspended_at, renewed_at, amount, payment_status, payment_method, auto_renew, notes, created_at, plan_id, professional_id, " +
  "plan:plan_id(id, name, price, billing_period), " +
  "professional:professional_id(id, slug, professional_name, business_name, whatsapp, city, state, profile_status, user_id, avatar_media_id)";

export async function listSubscriptions(): Promise<SubscriptionRow[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(SELECT)
    .order("expires_at", { ascending: true, nullsFirst: false })
    .limit(1000);
  if (error) throw error;
  const rows = (data ?? []) as unknown as SubscriptionRow[];

  const userIds = rows.map((r) => r.professional?.user_id).filter(Boolean) as string[];
  const profileMap = new Map<string, { full_name: string | null; email: string | null; phone: string | null }>();
  if (userIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, phone")
      .in("user_id", Array.from(new Set(userIds)));
    for (const p of profs ?? []) profileMap.set(p.user_id, p);
  }

  const { resolveMediaUrlsByIds } = await import("./adminMediaService");
  const urlMap = await resolveMediaUrlsByIds(rows.map((r) => r.professional?.avatar_media_id ?? null));

  const { data: notifs } = await supabase
    .from("subscription_notifications")
    .select("subscription_id, offset_days, created_at, channel")
    .order("created_at", { ascending: false })
    .limit(2000);
  const lastNotif = new Map<string, { offset_days: number; created_at: string; channel: string }>();
  for (const n of notifs ?? []) if (!lastNotif.has(n.subscription_id)) lastNotif.set(n.subscription_id, n);

  return rows.map((r) => {
    const prof = r.professional?.user_id ? profileMap.get(r.professional.user_id) : undefined;
    return {
      ...r,
      avatar_url: r.professional?.avatar_media_id ? urlMap.get(r.professional.avatar_media_id) ?? null : null,
      contact_name: prof?.full_name ?? r.professional?.professional_name ?? null,
      contact_email: prof?.email ?? null,
      contact_phone: prof?.phone ?? r.professional?.whatsapp ?? null,
      last_notification: lastNotif.get(r.id) ?? null,
      derived: derivedStatus(r),
    };
  });
}

export function computeMetrics(rows: SubscriptionRow[], extras: { activeWithoutPlan: number; deactivated: number }): SubscriptionMetrics {
  let active = 0, due30 = 0, due15 = 0, due7 = 0, dueToday = 0, expired = 0,
    suspended = 0, cancelled = 0, pending = 0, mrr = 0, notNotified = 0;
  for (const r of rows) {
    switch (r.derived) {
      case "active": active++; break;
      case "due_30": due30++; active++; break;
      case "due_15": due15++; active++; break;
      case "due_7": due7++; active++; break;
      case "due_today": dueToday++; active++; break;
      case "expired": expired++; break;
      case "suspended": suspended++; break;
      case "cancelled": cancelled++; break;
      case "pending": pending++; break;
    }
    if (["active", "due_30", "due_15", "due_7", "due_today"].includes(r.derived) && r.plan) {
      mrr += monthlyValue(Number(r.amount ?? r.plan.price), r.plan.billing_period);
    }
    if (["due_30", "due_15", "due_7", "due_today", "expired"].includes(r.derived) && !r.last_notification) notNotified++;
  }
  return {
    total: rows.length, active, due30, due15, due7, dueToday, expired, suspended, cancelled,
    pending, mrr, arr: mrr * 12, notNotified,
    activeWithoutPlan: extras.activeWithoutPlan,
    deactivated: extras.deactivated,
  };
}

export async function getProfileStatusCounts(): Promise<{ activeWithoutPlan: number; deactivated: number }> {
  const [{ data: pros }, { data: subs }] = await Promise.all([
    supabase.from("professional_profiles").select("id, profile_status").limit(2000),
    supabase.from("subscriptions").select("professional_id").limit(2000),
  ]);
  const withPlan = new Set((subs ?? []).map((s) => s.professional_id));
  let activeWithoutPlan = 0, deactivated = 0;
  for (const p of pros ?? []) {
    if (p.profile_status === "published" && !withPlan.has(p.id)) activeWithoutPlan++;
    if (p.profile_status !== "published") deactivated++;
  }
  return { activeWithoutPlan, deactivated };
}

// ---------- ações ----------

export async function activateSubscription(input: {
  id: string;
  activationAt?: string | null;
  expiresAt?: string | null;
  publishProfile?: boolean;
  note?: string | null;
}) {
  const { data, error } = await supabase.rpc("admin_activate_subscription", {
    _subscription_id: input.id,
    _activation_at: input.activationAt ?? new Date().toISOString(),
    _expires_at: input.expiresAt ?? null,
    _publish_profile: input.publishProfile ?? true,
    _note: input.note ?? null,
  });
  if (error) throw error;
  return data;
}

export async function setSubscriptionStatus(id: string, status: "active" | "pending" | "suspended" | "cancelled" | "expired", note?: string) {
  const { error } = await supabase.rpc("admin_set_subscription_status", {
    _subscription_id: id, _status: status, _note: note ?? null,
  });
  if (error) throw error;
}

export async function renewSubscription(input: {
  id: string;
  planId?: string | null;
  startDate?: string | null;
  expiresAt?: string | null;
  amount?: number | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  note?: string | null;
  reactivate?: boolean;
}) {
  const { error } = await supabase.rpc("admin_renew_subscription", {
    _subscription_id: input.id,
    _plan_id: input.planId ?? null,
    _start_date: input.startDate ?? null,
    _expires_at: input.expiresAt ?? null,
    _amount: input.amount ?? null,
    _payment_method: input.paymentMethod ?? null,
    _payment_status: input.paymentStatus ?? null,
    _note: input.note ?? null,
    _reactivate: input.reactivate ?? true,
  });
  if (error) throw error;
}

export async function updateSubscriptionFields(id: string, patch: {
  expires_at?: string | null;
  amount?: number | null;
  payment_method?: string | null;
  payment_status?: string | null;
  auto_renew?: boolean;
  notes?: string | null;
  plan_id?: string;
}) {
  const { error } = await supabase.from("subscriptions").update(patch).eq("id", id);
  if (error) throw error;
}

export async function setProfilePublicStatus(professionalId: string, published: boolean) {
  const { error } = await supabase
    .from("professional_profiles")
    .update({ profile_status: published ? "published" : "draft" })
    .eq("id", professionalId);
  if (error) throw error;
}

export async function listSubscriptionEvents(subscriptionId: string) {
  const { data, error } = await supabase
    .from("subscription_events")
    .select("id, event_type, from_status, to_status, note, metadata, created_at")
    .eq("subscription_id", subscriptionId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listSubscriptionNotifications(subscriptionId: string) {
  const { data, error } = await supabase
    .from("subscription_notifications")
    .select("id, offset_days, channel, recipient, status, message, error, created_at")
    .eq("subscription_id", subscriptionId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addSubscriptionNote(row: SubscriptionRow, note: string) {
  await updateSubscriptionFields(row.id, { notes: note });
  const { error } = await supabase.from("subscription_events").insert({
    subscription_id: row.id,
    professional_id: row.professional_id,
    event_type: "note",
    note,
    actor_user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
  });
  if (error) throw error;
}

export async function logManualNotification(row: SubscriptionRow, opts: { channel: string; message: string; recipient?: string | null }) {
  const { daysUntil } = await import("@/lib/subscriptionStatus");
  const { error } = await supabase.from("subscription_notifications").insert({
    subscription_id: row.id,
    professional_id: row.professional_id,
    offset_days: daysUntil(row.expires_at) ?? 0,
    channel: opts.channel,
    recipient: opts.recipient ?? null,
    status: "sent",
    message: opts.message,
    expires_at_snapshot: row.expires_at,
  });
  if (error && !String(error.message).includes("duplicate")) throw error;
  if (opts.channel === "in_app" && row.professional?.user_id) {
    await supabase.from("notifications").insert({
      user_id: row.professional.user_id,
      title: "Aviso sobre sua assinatura",
      message: opts.message,
      type: "system",
      link: "/painel",
    });
  }
}

// ---------- configurações ----------
export type SubscriptionSettings = {
  id: string;
  alert_offsets: number[];
  expiry_behavior: string;
  grace_days: number;
  notify_admins: boolean;
  notify_clients: boolean;
};

export async function getSubscriptionSettings(): Promise<SubscriptionSettings | null> {
  const { data, error } = await supabase
    .from("subscription_settings")
    .select("id, alert_offsets, expiry_behavior, grace_days, notify_admins, notify_clients")
    .eq("singleton", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSubscriptionSettings(id: string, patch: Partial<Omit<SubscriptionSettings, "id">>) {
  const { error } = await supabase.from("subscription_settings").update(patch).eq("id", id);
  if (error) throw error;
}

export async function runLifecycleNow() {
  const { data, error } = await supabase.rpc("process_subscription_lifecycle");
  if (error) throw error;
  return data as { expired: number; notified: number; deactivated: number };
}

/** Cria uma assinatura pendente para um profissional (sem ativar). */
export async function createSubscription(input: {
  professional_id: string;
  plan_id: string;
  amount?: number | null;
  payment_method?: string | null;
  payment_status?: string | null;
  auto_renew?: boolean;
  notes?: string | null;
}) {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      professional_id: input.professional_id,
      plan_id: input.plan_id,
      status: "pending",
      started_at: new Date().toISOString(),
      amount: input.amount ?? null,
      payment_method: input.payment_method ?? null,
      payment_status: input.payment_status ?? "pending",
      auto_renew: input.auto_renew ?? false,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}
