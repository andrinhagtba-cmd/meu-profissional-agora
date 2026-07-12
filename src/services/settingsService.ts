import { supabase } from "@/integrations/supabase/client";
import { getMediaUrl } from "./mediaService";

export type SystemSettings = {
  id: string;
  brand_name: string;
  tagline: string | null;
  logo_light_media_id: string | null;
  logo_dark_media_id: string | null;
  favicon_media_id: string | null;
  primary_color: string | null;
  accent_color: string | null;
  legal_name: string | null;
  cnpj: string | null;
  address: string | null;
  support_email: string | null;
  support_phone: string | null;
  whatsapp: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_linkedin: string | null;
  social_youtube: string | null;
  default_locale: string | null;
  default_timezone: string | null;
  default_currency: string | null;
  date_format: string | null;
  integrations: Record<string, IntegrationConfig>;
  email_templates: Record<string, EmailTemplate>;
  // resolved
  logo_light_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
};

export type IntegrationConfig = {
  enabled: boolean;
  config?: Record<string, string>;
};

export type EmailTemplate = {
  subject: string;
  body_html: string;
  enabled: boolean;
};

async function resolveMedia(
  ids: (string | null)[],
): Promise<Map<string, string>> {
  const list = ids.filter(Boolean) as string[];
  if (!list.length) return new Map();
  const { data } = await supabase
    .from("media_assets")
    .select("id, bucket_name, object_path")
    .in("id", list);
  const map = new Map<string, string>();
  await Promise.all(
    (data ?? []).map(async (r) => {
      const url = await getMediaUrl({ bucket: r.bucket_name, path: r.object_path });
      if (url) map.set(r.id, url);
    }),
  );
  return map;
}

export async function getSettings(): Promise<SystemSettings> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .eq("singleton", true)
    .maybeSingle();
  if (error) throw error;
  const row = (data ?? {}) as Partial<SystemSettings> & Record<string, unknown>;
  const mediaMap = await resolveMedia([
    (row.logo_light_media_id as string | null) ?? null,
    (row.logo_dark_media_id as string | null) ?? null,
    (row.favicon_media_id as string | null) ?? null,
  ]);
  return {
    id: (row.id as string) ?? "",
    brand_name: (row.brand_name as string) ?? "${BRAND_PLACEHOLDER}",
    tagline: (row.tagline as string) ?? null,
    logo_light_media_id: (row.logo_light_media_id as string | null) ?? null,
    logo_dark_media_id: (row.logo_dark_media_id as string | null) ?? null,
    favicon_media_id: (row.favicon_media_id as string | null) ?? null,
    primary_color: (row.primary_color as string) ?? "#0759F8",
    accent_color: (row.accent_color as string) ?? "#FF642E",
    legal_name: (row.legal_name as string | null) ?? null,
    cnpj: (row.cnpj as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    support_email: (row.support_email as string | null) ?? null,
    support_phone: (row.support_phone as string | null) ?? null,
    whatsapp: (row.whatsapp as string | null) ?? null,
    social_instagram: (row.social_instagram as string | null) ?? null,
    social_facebook: (row.social_facebook as string | null) ?? null,
    social_linkedin: (row.social_linkedin as string | null) ?? null,
    social_youtube: (row.social_youtube as string | null) ?? null,
    default_locale: (row.default_locale as string | null) ?? "pt-BR",
    default_timezone: (row.default_timezone as string | null) ?? "America/Sao_Paulo",
    default_currency: (row.default_currency as string | null) ?? "BRL",
    date_format: (row.date_format as string | null) ?? "dd/MM/yyyy",
    integrations: ((row.integrations as Record<string, IntegrationConfig>) ?? {}),
    email_templates: ((row.email_templates as Record<string, EmailTemplate>) ?? {}),
    logo_light_url: row.logo_light_media_id
      ? mediaMap.get(row.logo_light_media_id as string) ?? null
      : null,
    logo_dark_url: row.logo_dark_media_id
      ? mediaMap.get(row.logo_dark_media_id as string) ?? null
      : null,
    favicon_url: row.favicon_media_id
      ? mediaMap.get(row.favicon_media_id as string) ?? null
      : null,
  };
}

export type UpdateSettingsInput = Partial<
  Omit<
    SystemSettings,
    "id" | "logo_light_url" | "logo_dark_url" | "favicon_url"
  >
>;

export async function updateSettings(input: UpdateSettingsInput) {
  const { data, error } = await supabase
    .from("system_settings")
    .update(input as never)
    .eq("singleton", true)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return data;
}
