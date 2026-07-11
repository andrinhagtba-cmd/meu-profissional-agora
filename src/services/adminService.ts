// Camada de acesso para o Painel Administrativo.
// Todas as consultas dependem das policies de admin_* criadas na Etapa 7.

import { supabase } from "@/integrations/supabase/client";

export type AdminStats = {
  users: number;
  pros: number;
  quotes: number;
  proposals: number;
  reviews: number;
  pendingReviews: number;
  pendingPros: number;
  openReports: number;
};

async function count(table: string, filters?: (q: ReturnType<typeof supabase.from>) => unknown) {
  let q = supabase.from(table as never).select("id", { count: "exact", head: true });
  if (filters) filters(q as never);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

export async function getAdminStats(): Promise<AdminStats> {
  const [users, pros, quotes, proposals, reviews, pendingReviews, pendingPros, openReports] =
    await Promise.all([
      count("profiles"),
      count("professional_profiles"),
      count("quote_requests"),
      count("quote_proposals"),
      count("reviews"),
      (async () => {
        const { count, error } = await supabase
          .from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending");
        if (error) throw error; return count ?? 0;
      })(),
      (async () => {
        const { count, error } = await supabase
          .from("professional_profiles").select("id", { count: "exact", head: true })
          .eq("verification_status", "pending");
        if (error) throw error; return count ?? 0;
      })(),
      (async () => {
        const { count, error } = await supabase
          .from("reports").select("id", { count: "exact", head: true }).eq("status", "open");
        if (error) throw error; return count ?? 0;
      })(),
    ]);
  return { users, pros, quotes, proposals, reviews, pendingReviews, pendingPros, openReports };
}

export type AdminUserRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  account_status: string | null;
  created_at: string;
};

export async function listUsers(search = ""): Promise<AdminUserRow[]> {
  let q = supabase
    .from("profiles")
    .select("user_id, full_name, email, city, state, account_status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdminUserRow[];
}

export type AdminProRow = {
  id: string;
  slug: string | null;
  professional_name: string | null;
  business_name: string | null;
  city: string | null;
  state: string | null;
  verification_status: string;
  is_featured: boolean;
  average_rating: number | null;
  reviews_count: number | null;
  created_at: string;
};

export async function listPros(status?: string): Promise<AdminProRow[]> {
  let q = supabase
    .from("professional_profiles")
    .select("id, slug, professional_name, business_name, city, state, verification_status, is_featured, average_rating, reviews_count, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) q = q.eq("verification_status", status as never);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdminProRow[];
}

export async function setProVerification(id: string, status: "approved" | "rejected" | "pending") {
  const { error } = await supabase
    .from("professional_profiles").update({ verification_status: status }).eq("id", id);
  if (error) throw error;
}

export async function setProFeatured(id: string, featured: boolean) {
  const { error } = await supabase
    .from("professional_profiles").update({ is_featured: featured }).eq("id", id);
  if (error) throw error;
}

export type AdminReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
  professional?: { professional_name: string | null; slug: string | null } | null;
};

export async function listReviews(status?: string): Promise<AdminReviewRow[]> {
  let q = supabase
    .from("reviews")
    .select("id, rating, comment, status, created_at, professional:professional_id(professional_name, slug)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) q = q.eq("status", status as never);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as AdminReviewRow[];
}

export async function setReviewStatus(id: string, status: "approved" | "rejected" | "pending") {
  const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
  if (error) throw error;
}

export type AdminQuoteRow = {
  id: string;
  title: string;
  city: string;
  state: string;
  status: string;
  created_at: string;
};

export async function listQuotes(status?: string): Promise<AdminQuoteRow[]> {
  let q = supabase
    .from("quote_requests")
    .select("id, title, city, state, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) q = q.eq("status", status as never);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdminQuoteRow[];
}

// --- Reviews (cliente) ---
export async function submitReview(quoteId: string, rating: number, comment: string) {
  const { data, error } = await supabase.rpc("submit_review", {
    _quote_id: quoteId, _rating: rating, _comment: comment,
  });
  if (error) throw error;
  return data as string;
}

export async function getReviewForQuote(quoteId: string) {
  const { data, error } = await supabase
    .from("reviews").select("id, rating, comment, status")
    .eq("quote_request_id", quoteId).maybeSingle();
  if (error) throw error;
  return data;
}

// ============ Etapa 2 — Dashboard Overview ============

function dayKey(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().slice(0, 10);
}

async function fetchDaily(table: string, days = 30, dateCol = "created_at"): Promise<{ date: string; count: number }[]> {
  const since = new Date(Date.now() - (days - 1) * 86400000);
  since.setUTCHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from(table as never)
    .select(dateCol)
    .gte(dateCol, since.toISOString())
    .limit(5000);
  if (error) throw error;
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86400000);
    buckets.set(dayKey(d), 0);
  }
  for (const row of (data ?? []) as Array<Record<string, string>>) {
    const k = dayKey(row[dateCol]);
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

export type AdminTimeseries = {
  signups: { date: string; count: number }[];
  quotes: { date: string; count: number }[];
  proposals: { date: string; count: number }[];
};

export async function getAdminTimeseries(days = 30): Promise<AdminTimeseries> {
  const [signups, quotes, proposals] = await Promise.all([
    fetchDaily("profiles", days),
    fetchDaily("quote_requests", days),
    fetchDaily("quote_proposals", days),
  ]);
  return { signups, quotes, proposals };
}

export type AdminActivity = {
  id: string;
  type: "signup" | "quote" | "proposal" | "review" | "report";
  title: string;
  subtitle: string;
  at: string;
};

export async function getAdminActivity(limit = 20): Promise<AdminActivity[]> {
  const [profiles, quotes, proposals, reviews, reports] = await Promise.all([
    supabase.from("profiles").select("user_id, full_name, email, created_at").order("created_at", { ascending: false }).limit(limit),
    supabase.from("quote_requests").select("id, title, city, state, created_at").order("created_at", { ascending: false }).limit(limit),
    supabase.from("quote_proposals").select("id, estimated_price, created_at, quote_request:quote_request_id(title)").order("created_at", { ascending: false }).limit(limit),
    supabase.from("reviews").select("id, rating, status, created_at").order("created_at", { ascending: false }).limit(limit),
    supabase.from("reports").select("id, reason, status, created_at").order("created_at", { ascending: false }).limit(limit),
  ]);
  const out: AdminActivity[] = [];
  for (const p of (profiles.data ?? []) as Array<{ user_id: string; full_name: string | null; email: string | null; created_at: string }>) {
    out.push({ id: `s:${p.user_id}`, type: "signup", title: "Novo cadastro", subtitle: p.full_name ?? p.email ?? "Usuário", at: p.created_at });
  }
  for (const q of (quotes.data ?? []) as Array<{ id: string; title: string; city: string; state: string; created_at: string }>) {
    out.push({ id: `q:${q.id}`, type: "quote", title: "Novo pedido de orçamento", subtitle: `${q.title} · ${q.city}/${q.state}`, at: q.created_at });
  }
  for (const pr of (proposals.data ?? []) as Array<{ id: string; estimated_price: number | null; created_at: string; quote_request?: { title: string } | null }>) {
    const price = pr.estimated_price ? ` · R$ ${Number(pr.estimated_price).toLocaleString("pt-BR")}` : "";
    out.push({ id: `p:${pr.id}`, type: "proposal", title: "Nova proposta enviada", subtitle: `${pr.quote_request?.title ?? "Pedido"}${price}`, at: pr.created_at });
  }
  for (const r of (reviews.data ?? []) as Array<{ id: string; rating: number; status: string; created_at: string }>) {
    out.push({ id: `r:${r.id}`, type: "review", title: `Nova avaliação ${r.rating}★`, subtitle: `Status: ${r.status}`, at: r.created_at });
  }
  for (const rp of (reports.data ?? []) as Array<{ id: string; reason: string; status: string; created_at: string }>) {
    out.push({ id: `rp:${rp.id}`, type: "report", title: "Denúncia registrada", subtitle: `${rp.reason} · ${rp.status}`, at: rp.created_at });
  }
  return out.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, limit);
}

export type AdminTopCategory = {
  category_id: string;
  name: string;
  slug: string;
  quotes: number;
};

export async function getAdminTopCategories(limit = 6): Promise<AdminTopCategory[]> {
  const { data: cats, error: catErr } = await supabase
    .from("categories").select("id, name, slug").limit(200);
  if (catErr) throw catErr;
  const { data: quotes, error: qErr } = await supabase
    .from("quote_requests").select("category_id").limit(5000);
  if (qErr) throw qErr;
  const counts = new Map<string, number>();
  for (const q of (quotes ?? []) as Array<{ category_id: string | null }>) {
    if (!q.category_id) continue;
    counts.set(q.category_id, (counts.get(q.category_id) ?? 0) + 1);
  }
  return ((cats ?? []) as Array<{ id: string; name: string; slug: string }>)
    .map((c) => ({ category_id: c.id, name: c.name, slug: c.slug, quotes: counts.get(c.id) ?? 0 }))
    .sort((a, b) => b.quotes - a.quotes)
    .slice(0, limit);
}

export type AdminFunnel = {
  quotes: number;
  withProposal: number;
  accepted: number;
  reviewed: number;
};

export async function getAdminFunnel(): Promise<AdminFunnel> {
  const [quotesRes, proposalsRes, acceptedRes, reviewsRes] = await Promise.all([
    supabase.from("quote_requests").select("id", { count: "exact", head: true }),
    supabase.from("quote_proposals").select("quote_request_id"),
    supabase.from("quote_requests").select("id", { count: "exact", head: true }).not("selected_professional_id", "is", null),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
  ]);
  const withProposal = new Set(((proposalsRes.data ?? []) as Array<{ quote_request_id: string }>).map((p) => p.quote_request_id)).size;
  return {
    quotes: quotesRes.count ?? 0,
    withProposal,
    accepted: acceptedRes.count ?? 0,
    reviewed: reviewsRes.count ?? 0,
  };
}

// ============ Etapa 3 — People Management ============

export type AdminUserFull = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  account_status: string | null;
  created_at: string;
  roles: string[];
};

async function fetchRolesMap(userIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (userIds.length === 0) return map;
  const { data, error } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);
  if (error) throw error;
  for (const r of (data ?? []) as Array<{ user_id: string; role: string }>) {
    const arr = map.get(r.user_id) ?? [];
    arr.push(r.role);
    map.set(r.user_id, arr);
  }
  return map;
}

export async function listUsersFull(opts: { search?: string; role?: string; status?: string; limit?: number } = {}): Promise<AdminUserFull[]> {
  const { search = "", role, status, limit = 200 } = opts;
  let userIdsFilter: string[] | null = null;
  if (role) {
    const { data, error } = await supabase.from("user_roles").select("user_id").eq("role", role as never).limit(2000);
    if (error) throw error;
    userIdsFilter = ((data ?? []) as Array<{ user_id: string }>).map((r) => r.user_id);
    if (userIdsFilter.length === 0) return [];
  }
  let q = supabase
    .from("profiles")
    .select("user_id, full_name, email, phone, city, state, account_status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  if (status) q = q.eq("account_status", status as never);
  if (userIdsFilter) q = q.in("user_id", userIdsFilter);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as Array<Omit<AdminUserFull, "roles">>;
  const roles = await fetchRolesMap(rows.map((r) => r.user_id));
  return rows.map((r) => ({ ...r, roles: roles.get(r.user_id) ?? [] }));
}

export type AccountStatus = "active" | "suspended" | "pending";

export async function updateAccountStatus(userId: string, status: AccountStatus) {
  const { error } = await supabase.from("profiles").update({ account_status: status }).eq("user_id", userId);
  if (error) throw error;
}

export async function bulkUpdateAccountStatus(userIds: string[], status: AccountStatus) {
  if (userIds.length === 0) return;
  const { error } = await supabase.from("profiles").update({ account_status: status }).in("user_id", userIds);
  if (error) throw error;
}


export async function grantRole(userId: string, role: "admin" | "profissional" | "cliente") {
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role } as never);
  if (error && !String(error.message).includes("duplicate")) throw error;
}

export async function revokeRole(userId: string, role: "admin" | "profissional" | "cliente") {
  const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as never);
  if (error) throw error;
}

export type AdminVerificationRow = {
  id: string;
  slug: string | null;
  professional_name: string | null;
  business_name: string | null;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  verification_status: string;
  created_at: string;
  description: string | null;
};

export async function listVerificationQueue(status: string = "pending"): Promise<AdminVerificationRow[]> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select("id, slug, professional_name, business_name, whatsapp, city, state, verification_status, created_at, description")
    .eq("verification_status", status as never)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as AdminVerificationRow[];
}

export async function bulkVerifyPros(ids: string[], status: "approved" | "rejected") {
  if (ids.length === 0) return;
  const { error } = await supabase.from("professional_profiles").update({ verification_status: status }).in("id", ids);
  if (error) throw error;
}
