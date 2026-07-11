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
  whatsapp: string | null;
  description: string | null;
};

export async function listPros(status?: string, search?: string, featured?: boolean): Promise<AdminProRow[]> {
  let q = supabase
    .from("professional_profiles")
    .select("id, slug, professional_name, business_name, city, state, verification_status, is_featured, average_rating, reviews_count, created_at, whatsapp, description")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) q = q.eq("verification_status", status as never);
  if (typeof featured === "boolean") q = q.eq("is_featured", featured);
  if (search && search.trim()) {
    const s = search.trim().replace(/[%,]/g, "");
    q = q.or(`professional_name.ilike.%${s}%,business_name.ilike.%${s}%,city.ilike.%${s}%,slug.ilike.%${s}%`);
  }
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

export async function bulkFeaturePros(ids: string[], featured: boolean) {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("professional_profiles").update({ is_featured: featured }).in("id", ids);
  if (error) throw error;
}

export async function setProProfileStatus(id: string, status: "draft" | "published" | "archived") {
  const { error } = await supabase
    .from("professional_profiles").update({ profile_status: status as never }).eq("id", id);
  if (error) throw error;
}

export type AdminProProfilePatch = Partial<{
  professional_name: string | null;
  business_name: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  whatsapp: string | null;
  years_experience: number | null;
  starting_price: number | null;
  response_time: string | null;
  availability_status: "available" | "busy" | "unavailable";
  emergency: boolean;
  is_featured: boolean;
  service_types: string[];
  profile_status: "draft" | "published" | "archived";
}>;

export async function updateProProfile(id: string, patch: AdminProProfilePatch) {
  const { error } = await supabase
    .from("professional_profiles")
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export type AdminProDetail = AdminProRow & {
  user_id: string;
  years_experience: number | null;
  starting_price: number | null;
  response_time: string | null;
  profile_status: string;
  availability_status: string;
  emergency: boolean;
  service_types: string[] | null;
  updated_at: string;
  avatar_media_id: string | null;
  cover_media_id: string | null;
  source: string | null;
  profile_email: string | null;
  profile_full_name: string | null;
  profile_avatar_url: string | null;
  counts: { services: number; portfolio: number; leads: number; reviews: number };
};

export async function getProDetail(id: string): Promise<AdminProDetail> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select(`
      id, user_id, slug, professional_name, business_name, city, state,
      verification_status, is_featured, average_rating, reviews_count,
      created_at, whatsapp, description, years_experience, starting_price,
      response_time, profile_status, availability_status, emergency,
      service_types, updated_at, avatar_media_id, cover_media_id, source
    `)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Profissional não encontrado.");

  const p = data as Record<string, unknown>;
  const userId = p.user_id as string;

  const [profileRes, svc, port, lead, rev] = await Promise.all([
    supabase.from("profiles").select("email, full_name, avatar_url").eq("id", userId).maybeSingle(),
    supabase.from("professional_services").select("id", { count: "exact", head: true }).eq("professional_id", id),
    supabase.from("portfolio_items").select("id", { count: "exact", head: true }).eq("professional_id", id),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("professional_id", id),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("professional_id", id),
  ]);

  const prof = profileRes.data as { email?: string | null; full_name?: string | null; avatar_url?: string | null } | null;

  
  return {
    ...(p as unknown as AdminProRow),
    user_id: p.user_id as string,
    years_experience: (p.years_experience as number | null) ?? null,
    starting_price: (p.starting_price as number | null) ?? null,
    response_time: (p.response_time as string | null) ?? null,
    profile_status: p.profile_status as string,
    availability_status: p.availability_status as string,
    emergency: Boolean(p.emergency),
    service_types: (p.service_types as string[] | null) ?? null,
    updated_at: p.updated_at as string,
    avatar_media_id: (p.avatar_media_id as string | null) ?? null,
    cover_media_id: (p.cover_media_id as string | null) ?? null,
    source: (p.source as string | null) ?? null,
    profile_email: prof?.email ?? null,
    profile_full_name: prof?.full_name ?? null,
    profile_avatar_url: prof?.avatar_url ?? null,
    counts: {
      services: svc.count ?? 0,
      portfolio: port.count ?? 0,
      leads: lead.count ?? 0,
      reviews: rev.count ?? 0,
    },
  };
}

// ============= Serviços do profissional (Bloco C) =============

export type ProPriceType = "fixed" | "hourly" | "daily" | "per_visit" | "to_quote";

export type AdminProServiceRow = {
  id: string;
  service_id: string;
  description: string | null;
  starting_price: number | null;
  price_type: ProPriceType;
  active: boolean;
  created_at: string;
  service: {
    id: string;
    name: string;
    slug: string | null;
    category: { id: string; name: string } | null;
  } | null;
};

export async function listProServices(professionalId: string): Promise<AdminProServiceRow[]> {
  const { data, error } = await supabase
    .from("professional_services")
    .select(`
      id, service_id, description, starting_price, price_type, active, created_at,
      service:service_id (
        id, name, slug,
        category:category_id ( id, name )
      )
    `)
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdminProServiceRow[];
}

export type ServiceCatalogRow = {
  id: string;
  name: string;
  slug: string | null;
  active: boolean;
  category: { id: string; name: string } | null;
};

export async function listServiceCatalog(): Promise<ServiceCatalogRow[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, slug, active, category:category_id(id, name)")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []) as unknown as ServiceCatalogRow[];
}

export type ProServicePatch = Partial<{
  description: string | null;
  starting_price: number | null;
  price_type: ProPriceType;
  active: boolean;
}>;

export async function createProService(
  professionalId: string,
  serviceId: string,
  patch: ProServicePatch,
) {
  const { error } = await supabase.from("professional_services").insert({
    professional_id: professionalId,
    service_id: serviceId,
    description: patch.description ?? null,
    starting_price: patch.starting_price ?? null,
    price_type: (patch.price_type ?? "to_quote") as never,
    active: patch.active ?? true,
  });
  if (error) throw error;
}

export async function updateProService(id: string, patch: ProServicePatch) {
  const { error } = await supabase
    .from("professional_services")
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProService(id: string) {
  const { error } = await supabase.from("professional_services").delete().eq("id", id);
  if (error) throw error;
}

// ============= Portfólio (Bloco C) =============

export type AdminPortfolioItem = {
  id: string;
  title: string | null;
  description: string | null;
  media_asset_id: string | null;
  image_url: string | null;
  sort_order: number;
  status: string;
  created_at: string;
  url: string; // resolved (signed) URL for display
};

export async function updatePortfolioItem(
  id: string,
  patch: Partial<{ title: string | null; description: string | null; sort_order: number; status: string }>,
) {
  const { error } = await supabase.from("portfolio_items").update(patch as never).eq("id", id);
  if (error) throw error;
}

// ============= Documentos / Verificação (Bloco D) =============

export type VerificationStatus = "pending" | "approved" | "rejected";

export type AdminProDocument = {
  id: string;
  title: string;
  institution: string | null;
  issued_at: string | null;
  document_url: string | null;
  verification_status: VerificationStatus;
  created_at: string;
  signed_url: string | null;
  file_name: string | null;
};

const DOC_BUCKET = "private-documents";

function parseStoragePath(raw: string | null): { bucket: string; path: string } | null {
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return null;
  // Accept "bucket/path" or "path" (assumed private-documents)
  const idx = raw.indexOf("/");
  if (idx > 0 && !raw.startsWith("/")) {
    const maybeBucket = raw.slice(0, idx);
    if (maybeBucket === DOC_BUCKET || maybeBucket === "public-media") {
      return { bucket: maybeBucket, path: raw.slice(idx + 1) };
    }
  }
  return { bucket: DOC_BUCKET, path: raw };
}

async function signDocumentUrl(raw: string | null): Promise<string | null> {
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  const parsed = parseStoragePath(raw);
  if (!parsed) return null;
  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, 60 * 30);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function listProDocuments(professionalId: string): Promise<AdminProDocument[]> {
  const { data, error } = await supabase
    .from("certifications")
    .select("id, title, institution, issued_at, document_url, verification_status, created_at")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string; title: string; institution: string | null; issued_at: string | null;
    document_url: string | null; verification_status: VerificationStatus; created_at: string;
  }>;
  const signed = await Promise.all(rows.map((r) => signDocumentUrl(r.document_url)));
  return rows.map((r, i) => {
    const parsed = parseStoragePath(r.document_url);
    const file_name = parsed ? parsed.path.split("/").pop() ?? null : null;
    return { ...r, signed_url: signed[i], file_name };
  });
}

export async function uploadProDocument(params: {
  professionalId: string;
  professionalUserId: string | null;
  file: File;
  title: string;
  institution?: string | null;
  issued_at?: string | null;
}): Promise<AdminProDocument> {
  const { professionalId, professionalUserId, file, title, institution, issued_at } = params;
  if (!professionalUserId) throw new Error("Este profissional não tem usuário vinculado.");
  const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, "_");
  const path = `${professionalUserId}/documents/${Date.now()}_${safe}`;
  const up = await supabase.storage.from(DOC_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (up.error) throw up.error;

  const { data, error } = await supabase
    .from("certifications")
    .insert({
      professional_id: professionalId,
      title,
      institution: institution ?? null,
      issued_at: issued_at ?? null,
      document_url: path,
      verification_status: "pending",
    })
    .select("id, title, institution, issued_at, document_url, verification_status, created_at")
    .single();
  if (error) {
    // rollback storage upload
    await supabase.storage.from(DOC_BUCKET).remove([path]);
    throw error;
  }
  const signed = await signDocumentUrl(data.document_url);
  return {
    ...(data as never as AdminProDocument),
    signed_url: signed,
    file_name: safe,
  };
}

export async function setDocumentStatus(id: string, status: VerificationStatus) {
  const { error } = await supabase
    .from("certifications")
    .update({ verification_status: status })
    .eq("id", id);
  if (error) throw error;
}

export async function updateDocumentMeta(
  id: string,
  patch: Partial<{ title: string; institution: string | null; issued_at: string | null }>,
) {
  const { error } = await supabase.from("certifications").update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function deleteProDocument(id: string, storagePath: string | null) {
  const { error } = await supabase.from("certifications").delete().eq("id", id);
  if (error) throw error;
  const parsed = parseStoragePath(storagePath);
  if (parsed) {
    await supabase.storage.from(parsed.bucket).remove([parsed.path]);
  }
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



// ============= Bloco E — Reviews & Atividade =============

export type ReviewStatus = "pending" | "approved" | "rejected" | "flagged";

export type AdminProReview = {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  professional_reply: string | null;
  created_at: string;
  quote_request_id: string;
  client_name: string | null;
  quote_title: string | null;
};

export async function listProReviews(professionalId: string): Promise<AdminProReview[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, status, professional_reply, created_at, quote_request_id, client_id")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string; rating: number; comment: string | null; status: ReviewStatus;
    professional_reply: string | null; created_at: string;
    quote_request_id: string; client_id: string;
  }>;
  if (rows.length === 0) return [];
  const clientIds = Array.from(new Set(rows.map(r => r.client_id)));
  const quoteIds = Array.from(new Set(rows.map(r => r.quote_request_id)));
  const [{ data: profs }, { data: quotes }] = await Promise.all([
    supabase.from("profiles").select("user_id, full_name").in("user_id", clientIds),
    supabase.from("quote_requests").select("id, title").in("id", quoteIds),
  ]);
  const nameByUser = new Map((profs ?? []).map((p: { user_id: string; full_name: string | null }) => [p.user_id, p.full_name]));
  const titleByQuote = new Map((quotes ?? []).map((q: { id: string; title: string }) => [q.id, q.title]));
  return rows.map(r => ({
    id: r.id, rating: r.rating, comment: r.comment, status: r.status,
    professional_reply: r.professional_reply, created_at: r.created_at,
    quote_request_id: r.quote_request_id,
    client_name: nameByUser.get(r.client_id) ?? null,
    quote_title: titleByQuote.get(r.quote_request_id) ?? null,
  }));
}

export async function setReviewStatus(id: string, status: ReviewStatus) {
  const { error } = await supabase.from("reviews").update({ status } as never).eq("id", id);
  if (error) throw error;
}

export async function deleteReview(id: string) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}

export type AdminProActivityItem = {
  id: string;
  kind: "quote" | "proposal" | "review" | "log";
  title: string;
  description: string | null;
  status: string | null;
  created_at: string;
};

export async function listProActivity(professionalId: string): Promise<AdminProActivityItem[]> {
  const [proposals, reviews, logs] = await Promise.all([
    supabase.from("quote_proposals")
      .select("id, status, created_at, price, quote_request:quote_request_id(title)")
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("reviews")
      .select("id, rating, comment, status, created_at")
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("admin_logs")
      .select("id, action, metadata, created_at")
      .eq("entity_type", "professional_profile")
      .eq("entity_id", professionalId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const items: AdminProActivityItem[] = [];
  for (const p of ((proposals.data ?? []) as unknown as Array<{
    id: string; status: string; created_at: string; price: number | null;
    quote_request: { title: string } | null;
  }>)) {
    items.push({
      id: `p-${p.id}`, kind: "proposal",
      title: `Proposta enviada${p.quote_request?.title ? " · " + p.quote_request.title : ""}`,
      description: p.price != null ? `R$ ${Number(p.price).toLocaleString("pt-BR")}` : null,
      status: p.status, created_at: p.created_at,
    });
  }
  for (const r of ((reviews.data ?? []) as Array<{
    id: string; rating: number; comment: string | null; status: string; created_at: string;
  }>)) {
    items.push({
      id: `r-${r.id}`, kind: "review",
      title: `Avaliação recebida (${r.rating}★)`,
      description: r.comment, status: r.status, created_at: r.created_at,
    });
  }
  for (const l of ((logs.data ?? []) as Array<{
    id: string; action: string; metadata: unknown; created_at: string;
  }>)) {
    items.push({
      id: `l-${l.id}`, kind: "log",
      title: `Ação admin: ${l.action}`,
      description: l.metadata ? JSON.stringify(l.metadata) : null,
      status: null, created_at: l.created_at,
    });
  }
  items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return items;
}
