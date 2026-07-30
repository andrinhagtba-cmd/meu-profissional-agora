import { supabasePublic } from "@/integrations/supabase/publicClient";
import { getMediaUrls, type MediaRef } from "./mediaService";
import { categories as staticCategories } from "@/data/categories";
import type { Category, CategoryFaq } from "@/types";

export interface CategoryVM extends Category {
  imageUrl: string;
  imageAlt: string;
  badgeVariant: string | null;
}

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  badge_text: string | null;
  badge_variant: string | null;
  badge_active: boolean | null;
  image_alt: string | null;
  image_url: string | null;
  display_order: number | null;
  card_media: { bucket_name: string; object_path: string } | null;
  cover_media: { bucket_name: string; object_path: string } | null;
}

async function fetchServiceNames(
  categoryIds: string[],
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (!categoryIds.length) return out;
  const { data, error } = await supabasePublic
    .from("services")
    .select("category_id, name, display_order")
    .in("category_id", categoryIds)
    .eq("active", true)
    .order("display_order", { ascending: true, nullsFirst: false });
  if (error || !data) return out;
  for (const row of data as { category_id: string; name: string }[]) {
    const list = out.get(row.category_id) ?? [];
    list.push(row.name);
    out.set(row.category_id, list);
  }
  return out;
}

interface CategoryStats {
  count: number;
  priceFrom: number;
  rating: number;
}

async function fetchCategoryStats(
  categoryIds: string[],
): Promise<Map<string, CategoryStats>> {
  const out = new Map<string, CategoryStats>();
  if (!categoryIds.length) return out;
  const { data: services } = await supabasePublic
    .from("services")
    .select("id, category_id")
    .in("category_id", categoryIds)
    .eq("active", true);
  const serviceToCategory = new Map<string, string>();
  for (const s of (services ?? []) as { id: string; category_id: string }[]) {
    serviceToCategory.set(s.id, s.category_id);
  }
  const serviceIds = Array.from(serviceToCategory.keys());
  if (!serviceIds.length) return out;
  const { data: links } = await supabasePublic
    .from("professional_services")
    .select("service_id, professional_id")
    .in("service_id", serviceIds)
    .eq("active", true);
  const proIds = new Set<string>();
  const catToPros = new Map<string, Set<string>>();
  for (const link of (links ?? []) as {
    service_id: string;
    professional_id: string;
  }[]) {
    const catId = serviceToCategory.get(link.service_id);
    if (!catId) continue;
    proIds.add(link.professional_id);
    const set = catToPros.get(catId) ?? new Set<string>();
    set.add(link.professional_id);
    catToPros.set(catId, set);
  }
  if (!proIds.size) return out;
  const { data: pros } = await supabasePublic
    .from("professional_profiles")
    .select("id, starting_price, average_rating")
    .in("id", Array.from(proIds))
    .eq("profile_status", "published");
  const proMap = new Map<
    string,
    { starting_price: number | null; average_rating: number | null }
  >();
  for (const p of (pros ?? []) as {
    id: string;
    starting_price: number | null;
    average_rating: number | null;
  }[]) {
    proMap.set(p.id, p);
  }
  for (const [catId, set] of catToPros) {
    let minPrice = Infinity;
    let ratingSum = 0;
    let ratingCount = 0;
    let published = 0;
    for (const pid of set) {
      const p = proMap.get(pid);
      if (!p) continue;
      published += 1;
      if (p.starting_price && p.starting_price > 0)
        minPrice = Math.min(minPrice, Number(p.starting_price));
      if (p.average_rating && p.average_rating > 0) {
        ratingSum += Number(p.average_rating);
        ratingCount += 1;
      }
    }
    out.set(catId, {
      count: published,
      priceFrom: Number.isFinite(minPrice) ? minPrice : 0,
      rating: ratingCount > 0 ? ratingSum / ratingCount : 0,
    });
  }
  return out;
}

function toVM(
  row: CategoryRow,
  imageUrl: string,
  services: string[],
  stats: CategoryStats | undefined,
): CategoryVM {
  const staticMatch = staticCategories.find((c) => c.slug === row.slug);
  const badgeActive = row.badge_active !== false;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    imageKey: row.slug,
    imageUrl,
    imageAlt:
      row.image_alt ??
      staticMatch?.name
        ? `Profissional de ${staticMatch?.name ?? row.name} em atendimento`
        : row.name,
    description: row.description ?? staticMatch?.description ?? "",
    badge: badgeActive && row.badge_text ? row.badge_text : undefined,
    badgeVariant: row.badge_variant ?? "orange",
    professionalsCount: stats?.count ?? 0,
    rating: stats?.rating ?? 0,
    priceFrom: stats?.priceFrom ?? 0,
    services: services.length > 0 ? services : staticMatch?.services ?? [],
    faqs: (staticMatch?.faqs ?? []) as CategoryFaq[],
  };
}

export async function listCategories(): Promise<CategoryVM[]> {
  const { data, error } = await supabasePublic
    .from("categories")
    .select(
      "id, slug, name, description, badge_text, badge_variant, badge_active, image_alt, image_url, display_order, card_media:card_media_id(bucket_name, object_path), cover_media:cover_media_id(bucket_name, object_path)",
    )
    .eq("active", true)
    .order("display_order", { ascending: true, nullsFirst: false });

  if (error) throw error;
  const rows = (data ?? []) as unknown as CategoryRow[];

  const refs: MediaRef[] = rows.map((r) => {
    const m = r.card_media ?? r.cover_media;
    return m ? { bucket: m.bucket_name, path: m.object_path } : null;
  });
  const [urls, servicesByCategory, statsByCategory] = await Promise.all([
    getMediaUrls(refs),
    fetchServiceNames(rows.map((r) => r.id)),
    fetchCategoryStats(rows.map((r) => r.id)),
  ]);

  return rows.map((row, idx) =>
    toVM(
      row,
      urls[idx] || row.image_url || "",
      servicesByCategory.get(row.id) ?? [],
      statsByCategory.get(row.id),
    ),
  );
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryVM | null> {
  const list = await listCategories();
  return list.find((c) => c.slug === slug) ?? null;
}
