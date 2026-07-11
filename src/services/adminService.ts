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
