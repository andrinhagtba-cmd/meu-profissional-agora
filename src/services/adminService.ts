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

// ============ Etapa 4 — Marketplace ============

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  active: boolean;
  display_order: number | null;
  created_at: string;
};

export async function listCategoriesAdmin(search = ""): Promise<AdminCategory[]> {
  let q = supabase
    .from("categories")
    .select("id, name, slug, description, icon, active, display_order, created_at")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true })
    .limit(500);
  if (search) q = q.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdminCategory[];
}

export type UpsertCategoryInput = {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  active?: boolean;
  display_order?: number | null;
};

export async function upsertCategory(input: UpsertCategoryInput) {
  const payload = {
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    icon: input.icon ?? null,
    active: input.active ?? true,
    display_order: input.display_order ?? 0,
  };
  if (input.id) {
    const { error } = await supabase.from("categories").update(payload).eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("categories").insert(payload);
    if (error) throw error;
  }
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleCategoryActive(id: string, active: boolean) {
  const { error } = await supabase.from("categories").update({ active }).eq("id", id);
  if (error) throw error;
}

// Services
export type AdminService = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  display_order: number | null;
  category?: { name: string; slug: string } | null;
};

export async function listServicesAdmin(opts: { search?: string; categoryId?: string } = {}): Promise<AdminService[]> {
  let q = supabase
    .from("services")
    .select("id, category_id, name, slug, description, active, display_order, category:category_id(name, slug)")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true })
    .limit(500);
  if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
  if (opts.search) q = q.or(`name.ilike.%${opts.search}%,slug.ilike.%${opts.search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as AdminService[];
}

export type UpsertServiceInput = {
  id?: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string | null;
  active?: boolean;
  display_order?: number | null;
};

export async function upsertService(input: UpsertServiceInput) {
  const payload = {
    category_id: input.category_id,
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    active: input.active ?? true,
    display_order: input.display_order ?? 0,
  };
  if (input.id) {
    const { error } = await supabase.from("services").update(payload).eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("services").insert(payload);
    if (error) throw error;
  }
}

export async function deleteService(id: string) {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}

// Quotes com detalhes
export type AdminQuoteFull = {
  id: string;
  title: string;
  city: string;
  state: string;
  status: string;
  urgency: string | null;
  created_at: string;
  client?: { full_name: string | null; email: string | null } | null;
  category?: { name: string | null } | null;
  proposals_count?: number;
};

export async function listQuotesFull(opts: { search?: string; status?: string } = {}): Promise<AdminQuoteFull[]> {
  let q = supabase
    .from("quote_requests")
    .select("id, title, city, state, status, urgency, created_at, client:client_id(full_name, email), category:category_id(name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (opts.status) q = q.eq("status", opts.status as never);
  if (opts.search) q = q.ilike("title", `%${opts.search}%`);
  const { data, error } = await q;
  if (error) throw error;
  const quotes = (data ?? []) as unknown as AdminQuoteFull[];
  if (quotes.length > 0) {
    const ids = quotes.map((q) => q.id);
    const { data: props } = await supabase.from("quote_proposals").select("quote_request_id").in("quote_request_id", ids);
    const counts = new Map<string, number>();
    for (const p of (props ?? []) as Array<{ quote_request_id: string }>) {
      counts.set(p.quote_request_id, (counts.get(p.quote_request_id) ?? 0) + 1);
    }
    for (const q of quotes) q.proposals_count = counts.get(q.id) ?? 0;
  }
  return quotes;
}

// Proposals
export type AdminProposalRow = {
  id: string;
  message: string | null;
  estimated_price: number | null;
  estimated_deadline: string | null;
  status: string;
  created_at: string;
  professional?: { professional_name: string | null; slug: string | null } | null;
  quote_request?: { id: string; title: string; city: string | null; state: string | null } | null;
};

export async function listProposalsAdmin(opts: { search?: string; status?: string } = {}): Promise<AdminProposalRow[]> {
  let q = supabase
    .from("quote_proposals")
    .select("id, message, estimated_price, estimated_deadline, status, created_at, professional:professional_id(professional_name, slug), quote_request:quote_request_id(id, title, city, state)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (opts.status) q = q.eq("status", opts.status as never);
  const { data, error } = await q;
  if (error) throw error;
  let rows = (data ?? []) as unknown as AdminProposalRow[];
  if (opts.search) {
    const s = opts.search.toLowerCase();
    rows = rows.filter((r) =>
      r.quote_request?.title?.toLowerCase().includes(s) ||
      r.professional?.professional_name?.toLowerCase().includes(s),
    );
  }
  return rows;
}

// Reports
export type AdminReportRow = {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  reporter_user_id: string | null;
  reported_user_id: string | null;
  review_id: string | null;
};

export async function listReportsAdmin(status?: string): Promise<AdminReportRow[]> {
  let q = supabase
    .from("reports")
    .select("id, reason, description, status, created_at, resolved_at, reporter_user_id, reported_user_id, review_id")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) q = q.eq("status", status as never);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdminReportRow[];
}

export async function setReportStatus(id: string, status: "open" | "reviewing" | "resolved" | "dismissed") {
  const patch: { status: typeof status; resolved_at?: string } = { status };
  if (status === "resolved" || status === "dismissed") patch.resolved_at = new Date().toISOString();
  const { error } = await supabase.from("reports").update(patch).eq("id", id);
  if (error) throw error;
}

// ============ Etapa 5 — Monetização ============

export type AdminPlan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: string;
  lead_limit: number | null;
  featured_profile: boolean;
  active: boolean;
  features: string[] | null;
  created_at: string;
};

export async function listPlansAdmin(): Promise<AdminPlan[]> {
  const { data, error } = await supabase
    .from("plans")
    .select("id, name, description, price, billing_period, lead_limit, featured_profile, active, features, created_at")
    .order("price", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    features: Array.isArray((r as { features: unknown }).features)
      ? ((r as { features: string[] }).features)
      : null,
  })) as AdminPlan[];
}

export type UpsertPlanInput = {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  billing_period: string;
  lead_limit?: number | null;
  featured_profile?: boolean;
  active?: boolean;
  features?: string[];
};

export async function upsertPlan(input: UpsertPlanInput) {
  const payload = {
    name: input.name,
    description: input.description ?? null,
    price: input.price,
    billing_period: input.billing_period,
    lead_limit: input.lead_limit ?? null,
    featured_profile: input.featured_profile ?? false,
    active: input.active ?? true,
    features: input.features ?? [],
  };
  if (input.id) {
    const { error } = await supabase.from("plans").update(payload).eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("plans").insert(payload);
    if (error) throw error;
  }
}

export async function deletePlan(id: string) {
  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) throw error;
}

export async function togglePlanActive(id: string, active: boolean) {
  const { error } = await supabase.from("plans").update({ active }).eq("id", id);
  if (error) throw error;
}

export type AdminSubscriptionRow = {
  id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  external_reference: string | null;
  created_at: string;
  plan?: { id: string; name: string; price: number; billing_period: string } | null;
  professional?: { id: string; professional_name: string | null; slug: string | null } | null;
};

export async function listSubscriptionsAdmin(opts: { search?: string; status?: string } = {}): Promise<AdminSubscriptionRow[]> {
  let q = supabase
    .from("subscriptions")
    .select("id, status, started_at, expires_at, external_reference, created_at, plan:plan_id(id, name, price, billing_period), professional:professional_id(id, professional_name, slug)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (opts.status) q = q.eq("status", opts.status as never);
  const { data, error } = await q;
  if (error) throw error;
  let rows = (data ?? []) as unknown as AdminSubscriptionRow[];
  if (opts.search) {
    const s = opts.search.toLowerCase();
    rows = rows.filter((r) =>
      r.professional?.professional_name?.toLowerCase().includes(s) ||
      r.plan?.name.toLowerCase().includes(s),
    );
  }
  return rows;
}

export async function updateSubscriptionStatus(id: string, status: "active" | "cancelled" | "past_due" | "trialing") {
  const { error } = await supabase.from("subscriptions").update({ status } as never).eq("id", id);
  if (error) throw error;
}

export type AdminBillingSummary = {
  activeSubs: number;
  trialingSubs: number;
  cancelledSubs: number;
  mrr: number;
  arpu: number;
  planBreakdown: { plan: string; count: number; revenue: number }[];
  monthly: { date: string; revenue: number }[];
};

export async function getBillingSummary(): Promise<AdminBillingSummary> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, status, started_at, plan:plan_id(name, price, billing_period)")
    .limit(2000);
  if (error) throw error;
  const rows = (data ?? []) as unknown as Array<{
    id: string; status: string; started_at: string;
    plan: { name: string; price: number; billing_period: string } | null;
  }>;
  const monthly = new Map<string, number>();
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthly.set(d.toISOString().slice(0, 7), 0);
  }
  const breakdown = new Map<string, { count: number; revenue: number }>();
  let active = 0, trialing = 0, cancelled = 0, mrr = 0;
  for (const r of rows) {
    if (r.status === "active") active++;
    if (r.status === "trialing") trialing++;
    if (r.status === "cancelled") cancelled++;
    const price = Number(r.plan?.price ?? 0);
    const period = r.plan?.billing_period ?? "monthly";
    const monthly_value = period === "yearly" ? price / 12 : price;
    if (r.status === "active") {
      mrr += monthly_value;
      const name = r.plan?.name ?? "—";
      const cur = breakdown.get(name) ?? { count: 0, revenue: 0 };
      cur.count++; cur.revenue += monthly_value;
      breakdown.set(name, cur);
    }
    const key = r.started_at?.slice(0, 7);
    if (key && monthly.has(key)) monthly.set(key, (monthly.get(key) ?? 0) + monthly_value);
  }
  return {
    activeSubs: active, trialingSubs: trialing, cancelledSubs: cancelled,
    mrr, arpu: active > 0 ? mrr / active : 0,
    planBreakdown: Array.from(breakdown.entries())
      .map(([plan, v]) => ({ plan, count: v.count, revenue: v.revenue }))
      .sort((a, b) => b.revenue - a.revenue),
    monthly: Array.from(monthly.entries()).map(([date, revenue]) => ({ date, revenue })),
  };
}


