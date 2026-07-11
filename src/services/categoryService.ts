import { supabase } from "@/integrations/supabase/client";
import { getMediaUrls, type MediaRef } from "./mediaService";
import { categories as staticCategories } from "@/data/categories";
import type { Category, CategoryFaq } from "@/types";

export interface CategoryVM extends Category {
  imageUrl: string;
  imageAlt: string;
}

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  badge_text: string | null;
  badge_active: boolean | null;
  image_alt: string | null;
  display_order: number | null;
  card_media: { bucket_name: string; object_path: string } | null;
}

async function fetchServiceNames(
  categoryIds: string[],
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (!categoryIds.length) return out;
  const { data, error } = await supabase
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

function toVM(
  row: CategoryRow,
  imageUrl: string,
  services: string[],
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
    badge: badgeActive && row.badge_text ? row.badge_text : staticMatch?.badge,
    professionalsCount: staticMatch?.professionalsCount ?? 0,
    rating: staticMatch?.rating ?? 5,
    priceFrom: staticMatch?.priceFrom ?? 0,
    services: services.length > 0 ? services : staticMatch?.services ?? [],
    faqs: (staticMatch?.faqs ?? []) as CategoryFaq[],
  };
}

export async function listCategories(): Promise<CategoryVM[]> {
  const { data, error } = await supabase
    .from("categories")
    .select(
      "id, slug, name, description, badge_text, badge_active, image_alt, display_order, card_media:card_media_id(bucket_name, object_path)",
    )
    .eq("active", true)
    .order("display_order", { ascending: true, nullsFirst: false });

  if (error) throw error;
  const rows = (data ?? []) as unknown as CategoryRow[];

  const refs: MediaRef[] = rows.map((r) =>
    r.card_media
      ? { bucket: r.card_media.bucket_name, path: r.card_media.object_path }
      : null,
  );
  const [urls, servicesByCategory] = await Promise.all([
    getMediaUrls(refs),
    fetchServiceNames(rows.map((r) => r.id)),
  ]);

  return rows.map((row, idx) =>
    toVM(row, urls[idx] ?? "", servicesByCategory.get(row.id) ?? []),
  );
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryVM | null> {
  const list = await listCategories();
  return list.find((c) => c.slug === slug) ?? null;
}
