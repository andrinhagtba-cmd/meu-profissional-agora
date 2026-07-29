import { supabase } from "@/integrations/supabase/client";

/** Slugify no cliente (mesma regra da função SQL public.slugify_text). */
export function slugify(input: string): string {
  return (input ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/** Verifica se o slug está livre (ignora o próprio perfil). */
export async function isSlugAvailable(slug: string, profileId?: string | null): Promise<boolean> {
  const clean = slugify(slug);
  if (clean.length < 3) return false;
  const { data, error } = await supabase.rpc("professional_slug_available" as never, {
    _slug: clean,
    _profile_id: profileId ?? null,
  } as never);
  if (error) throw error;
  return Boolean(data);
}

/** Sugere slugs disponíveis a partir de um nome (empresa ou profissional). */
export async function suggestSlugs(
  base: string,
  profileId?: string | null,
  limit = 5,
): Promise<string[]> {
  const clean = slugify(base);
  if (clean.length < 3) return [];
  const { data, error } = await supabase.rpc("suggest_professional_slugs" as never, {
    _base: clean,
    _profile_id: profileId ?? null,
    _limit: limit,
  } as never);
  if (error) throw error;
  const rows = (data ?? []) as unknown as Array<{ slug: string } | string>;
  return rows.map((r) => (typeof r === "string" ? r : r.slug)).filter(Boolean);
}
