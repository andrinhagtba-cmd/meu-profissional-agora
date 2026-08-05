import { supabase } from "@/integrations/supabase/client";

// ---------- BLOG ----------
export type AdminBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  author: string | null;
  category: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
export type UpsertBlogPost = Partial<AdminBlogPost> & { title: string; slug: string };

export async function listBlogPosts(search?: string, status?: string) {
  let q = supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  if (search) q = q.or(`title.ilike.%${search}%,slug.ilike.%${search}%,author.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data as AdminBlogPost[];
}
export async function upsertBlogPost(input: UpsertBlogPost) {
  const payload = {
    ...input,
    published_at: input.status === "published" && !input.published_at ? new Date().toISOString() : input.published_at ?? null,
  };
  const { error } = input.id
    ? await supabase.from("blog_posts").update(payload).eq("id", input.id)
    : await supabase.from("blog_posts").insert(payload);
  if (error) throw error;
}
export async function deleteBlogPost(id: string) {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw error;
}

// ---------- TESTIMONIALS ----------
export type AdminTestimonial = {
  id: string;
  author: string;
  role: string | null;
  company: string | null;
  content: string;
  avatar_url: string | null;
  rating: number | null;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};
export type UpsertTestimonial = Partial<AdminTestimonial> & { author: string; content: string };

export async function listTestimonials(search?: string) {
  let q = supabase.from("testimonials").select("*").order("display_order").order("created_at", { ascending: false });
  if (search) q = q.or(`author.ilike.%${search}%,company.ilike.%${search}%,content.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data as AdminTestimonial[];
}
export async function upsertTestimonial(input: UpsertTestimonial) {
  const { error } = input.id
    ? await supabase.from("testimonials").update(input).eq("id", input.id)
    : await supabase.from("testimonials").insert(input);
  if (error) throw error;
}
export async function deleteTestimonial(id: string) {
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw error;
}
export async function toggleTestimonialPublish(id: string, v: boolean) {
  const { error } = await supabase.from("testimonials").update({ is_published: v }).eq("id", id);
  if (error) throw error;
}

// ---------- FAQs ----------
export type AdminFaq = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};
export type UpsertFaq = Partial<AdminFaq> & { question: string; answer: string };

export async function listFaqs(search?: string) {
  let q = supabase.from("admin_faqs").select("*").order("display_order").order("created_at");
  if (search) q = q.or(`question.ilike.%${search}%,answer.ilike.%${search}%,category.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data as AdminFaq[];
}
export async function upsertFaq(input: UpsertFaq) {
  const { error } = input.id
    ? await supabase.from("admin_faqs").update(input).eq("id", input.id)
    : await supabase.from("admin_faqs").insert(input);
  if (error) throw error;
}
export async function deleteFaq(id: string) {
  const { error } = await supabase.from("admin_faqs").delete().eq("id", id);
  if (error) throw error;
}

// ---------- BANNERS ----------
export type AdminBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  image_url_mobile: string | null;
  link_url: string | null;
  position: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  display_order: number;
  highlight_text: string | null;
  cta_primary_label: string | null;
  cta_primary_href: string | null;
  cta_secondary_label: string | null;
  cta_secondary_href: string | null;
  rotation_seconds: number;
  created_at: string;
  updated_at: string;
};
export type UpsertBanner = Partial<AdminBanner>;

export async function listBanners(search?: string, position?: string) {
  let q = supabase.from("banners").select("*").order("display_order").order("created_at", { ascending: false });
  if (position) q = q.eq("position", position);
  if (search) q = q.or(`title.ilike.%${search}%,subtitle.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data as AdminBanner[];
}
export async function upsertBanner(input: UpsertBanner) {
  const { error } = input.id
    ? await supabase.from("banners").update(input).eq("id", input.id)
    : await supabase.from("banners").insert(input);
  if (error) throw error;
}
export async function deleteBanner(id: string) {
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw error;
}
export async function toggleBannerActive(id: string, v: boolean) {
  const { error } = await supabase.from("banners").update({ is_active: v }).eq("id", id);
  if (error) throw error;
}

// ---------- PAGES ----------
export type AdminSitePage = {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  meta_description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};
export type UpsertSitePage = Partial<AdminSitePage> & { title: string; slug: string };

export async function listSitePages(search?: string) {
  let q = supabase.from("site_pages").select("*").order("created_at", { ascending: false });
  if (search) q = q.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data as AdminSitePage[];
}
export async function upsertSitePage(input: UpsertSitePage) {
  const { error } = input.id
    ? await supabase.from("site_pages").update(input).eq("id", input.id)
    : await supabase.from("site_pages").insert(input);
  if (error) throw error;
}
export async function deleteSitePage(id: string) {
  const { error } = await supabase.from("site_pages").delete().eq("id", id);
  if (error) throw error;
}

// ---------- MEDIA (listagem) ----------
export type AdminMediaAsset = {
  id: string;
  bucket_name: string;
  object_path: string;
  usage_type: string | null;
  entity_type: string | null;
  alt_text: string | null;
  title: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
};

export async function listMediaAssets(search?: string, usage?: string) {
  let q = supabase
    .from("media_assets")
    .select("id, bucket_name, object_path, usage_type, entity_type, alt_text, title, file_size_bytes, mime_type, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (usage) q = q.eq("usage_type", usage);
  if (search) q = q.or(`object_path.ilike.%${search}%,alt_text.ilike.%${search}%,title.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data as AdminMediaAsset[];
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------- SHOWCASE REQUESTS (Pedidos recentes da home) ----------
export type AdminShowcaseRequest = {
  id: string;
  category: string;
  category_slug: string | null;
  description: string;
  city: string;
  state: string;
  request_date: string;
  urgency: string;
  proposals_count: number;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};
export type UpsertShowcaseRequest = Partial<AdminShowcaseRequest> & {
  category: string;
  description: string;
};

export async function listShowcaseRequests(search?: string) {
  let q = supabase
    .from("showcase_requests")
    .select("*")
    .order("display_order")
    .order("created_at", { ascending: false });
  if (search) q = q.or(`category.ilike.%${search}%,description.ilike.%${search}%,city.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data as AdminShowcaseRequest[];
}

export async function upsertShowcaseRequest(input: UpsertShowcaseRequest) {
  const payload = { ...input, category_slug: input.category_slug || slugify(input.category) };
  const { error } = input.id
    ? await supabase.from("showcase_requests").update(payload).eq("id", input.id)
    : await supabase.from("showcase_requests").insert(payload);
  if (error) throw error;
}

export async function deleteShowcaseRequest(id: string) {
  const { error } = await supabase.from("showcase_requests").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleShowcaseRequestPublish(id: string, v: boolean) {
  const { error } = await supabase.from("showcase_requests").update({ is_published: v }).eq("id", id);
  if (error) throw error;
}
