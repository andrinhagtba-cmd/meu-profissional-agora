import { supabase } from "@/integrations/supabase/client";
import { derivedStatus, monthlyValue, type DerivedStatus } from "@/lib/subscriptionStatus";

/** Últimos profissionais cadastrados (com avatar resolvido). */
export type LatestPro = {
  id: string;
  slug: string | null;
  name: string;
  city: string | null;
  state: string | null;
  location_label: string | null;
  profile_status: string;
  verification_status: string;
  created_at: string;
  avatar_url: string | null;
};

export async function getLatestProfessionals(limit = 6): Promise<LatestPro[]> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select(
      "id, slug, professional_name, business_name, city, state, location_label, profile_status, verification_status, created_at, avatar_media_id",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = data ?? [];
  const { resolveMediaUrlsByIds } = await import("./adminMediaService");
  const urls = await resolveMediaUrlsByIds(rows.map((r) => r.avatar_media_id ?? null));
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.business_name || r.professional_name || "Sem nome",
    city: r.city,
    state: r.state,
    location_label: r.location_label,
    profile_status: r.profile_status as string,
    verification_status: r.verification_status as string,
    created_at: r.created_at,
    avatar_url: r.avatar_media_id ? urls.get(r.avatar_media_id) ?? null : null,
  }));
}

/** Assinaturas vencendo / vencidas + resumo financeiro. */
export type ExpiringSub = {
  id: string;
  professional_id: string;
  name: string;
  whatsapp: string | null;
  plan_name: string | null;
  expires_at: string | null;
  amount: number | null;
  derived: DerivedStatus;
};

export type SubscriptionSummary = {
  mrr: number;
  arr: number;
  active: number;
  pending: number;
  expired: number;
  expiring30: number;
  expiring7: number;
  items: ExpiringSub[];
};

export async function getSubscriptionSummary(): Promise<SubscriptionSummary> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, status, activated_at, expires_at, amount, professional_id, plan:plan_id(name, price, billing_period), professional:professional_id(professional_name, business_name, whatsapp)",
    )
    .order("expires_at", { ascending: true, nullsFirst: false })
    .limit(1000);
  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    status: string;
    activated_at: string | null;
    expires_at: string | null;
    amount: number | null;
    professional_id: string;
    plan: { name: string; price: number; billing_period: string } | null;
    professional: { professional_name: string | null; business_name: string | null; whatsapp: string | null } | null;
  }>;

  let mrr = 0, active = 0, pending = 0, expired = 0, expiring30 = 0, expiring7 = 0;
  const items: ExpiringSub[] = [];

  for (const r of rows) {
    const d = derivedStatus(r);
    if (["active", "due_30", "due_15", "due_7", "due_today"].includes(d)) {
      active++;
      if (r.plan) mrr += monthlyValue(Number(r.amount ?? r.plan.price), r.plan.billing_period);
    }
    if (d === "pending") pending++;
    if (d === "expired") expired++;
    if (["due_30", "due_15", "due_7", "due_today"].includes(d)) expiring30++;
    if (["due_7", "due_today"].includes(d)) expiring7++;
    if (["due_30", "due_15", "due_7", "due_today", "expired"].includes(d)) {
      items.push({
        id: r.id,
        professional_id: r.professional_id,
        name: r.professional?.business_name || r.professional?.professional_name || "Profissional",
        whatsapp: r.professional?.whatsapp ?? null,
        plan_name: r.plan?.name ?? null,
        expires_at: r.expires_at,
        amount: r.amount ?? r.plan?.price ?? null,
        derived: d,
      });
    }
  }

  const order: DerivedStatus[] = ["expired", "due_today", "due_7", "due_15", "due_30"];
  items.sort((a, b) => order.indexOf(a.derived) - order.indexOf(b.derived));

  return { mrr, arr: mrr * 12, active, pending, expired, expiring30, expiring7, items: items.slice(0, 8) };
}

/** Contadores de pendências operacionais. */
export type AdminPendings = {
  photoRequests: number;
  contactMessages: number;
  openQuotes: number;
  publishedPros: number;
  draftPros: number;
  conversations: number;
  leads30: number;
  portfolioPending: number;
};

async function countWhere(table: string, apply: (q: any) => any): Promise<number> {
  const q = apply(supabase.from(table as never).select("id", { count: "exact", head: true }));
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}

export async function getAdminPendings(): Promise<AdminPendings> {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [photoRequests, contactMessages, openQuotes, publishedPros, draftPros, conversations, leads30, portfolioPending] =
    await Promise.all([
      countWhere("professional_photo_requests", (q) => q.eq("status", "pending")),
      countWhere("contact_messages", (q) => q.in("status", ["new", "open", "pending"])),
      countWhere("quote_requests", (q) => q.in("status", ["open", "receiving_proposals"])),
      countWhere("professional_profiles", (q) => q.eq("profile_status", "published")),
      countWhere("professional_profiles", (q) => q.neq("profile_status", "published")),
      countWhere("conversations", (q) => q),
      countWhere("leads", (q) => q.gte("created_at", since)),
      countWhere("portfolio_items", (q) => q.eq("moderation_status", "pending")),
    ]);
  return { photoRequests, contactMessages, openQuotes, publishedPros, draftPros, conversations, leads30, portfolioPending };
}

/** Profissionais mais vistos. */
export type TopViewedPro = {
  id: string;
  slug: string | null;
  name: string;
  views: number;
};

export async function getTopViewedPros(limit = 5): Promise<TopViewedPro[]> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select("id, slug, professional_name, business_name, initial_view_count, real_view_count")
    .order("real_view_count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? [])
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.business_name || r.professional_name || "Sem nome",
      views: Number(r.initial_view_count ?? 0) + Number(r.real_view_count ?? 0),
    }))
    .sort((a, b) => b.views - a.views);
}

/** Últimos pedidos recebidos. */
export type LatestQuote = {
  id: string;
  title: string;
  city: string | null;
  status: string;
  urgency: string;
  created_at: string;
  category_name: string | null;
};

export async function getLatestQuotes(limit = 6): Promise<LatestQuote[]> {
  const { data, error } = await supabase
    .from("quote_requests")
    .select("id, title, city, status, urgency, created_at, category:category_id(name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    city: r.city,
    status: r.status,
    urgency: r.urgency,
    created_at: r.created_at,
    category_name: r.category?.name ?? null,
  }));
}
