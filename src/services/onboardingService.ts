import { supabase } from "@/integrations/supabase/client";
import { getMediaUrl } from "./mediaService";

export interface OnboardingProfile {
  id: string;
  user_id: string;
  slug: string | null;
  professional_name: string | null;
  business_name: string | null;
  description: string | null;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  years_experience: number | null;
  service_types: string[] | null;
  search_tags: string[] | null;
  onboarding_step: number;
  onboarding_completed_at: string | null;
  profile_status: string | null;

  avatar_media_id: string | null;
  cover_media_id: string | null;
  avatar_url: string;
  cover_url: string;

  instagram_username: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  website_url: string | null;

  formatted_address: string | null;
  postal_code: string | null;
  street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_reference: string | null;
  holiday_note: string | null;
  neighborhood: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string | null;
  service_radius_km: number | null;
  serves_at_business_address: boolean | null;
  serves_at_customer_location: boolean | null;
  serves_remotely: boolean | null;
  public_address_visibility: string | null;
}

export async function getMyOnboarding(userId: string): Promise<OnboardingProfile | null> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  let avatar_url = "";
  let cover_url = "";
  const ids: string[] = [];
  if (data.avatar_media_id) ids.push(data.avatar_media_id);
  if (data.cover_media_id) ids.push(data.cover_media_id);
  if (ids.length) {
    const { data: assets } = await supabase
      .from("media_assets")
      .select("id,bucket_name,object_path")
      .in("id", ids);
    const map = new Map<string, { bucket: string; path: string }>();
    (assets ?? []).forEach((r: any) =>
      map.set(r.id, { bucket: r.bucket_name, path: r.object_path }),
    );
    if (data.avatar_media_id) {
      const ref = map.get(data.avatar_media_id);
      if (ref) avatar_url = await getMediaUrl(ref);
    }
    if (data.cover_media_id) {
      const ref = map.get(data.cover_media_id);
      if (ref) cover_url = await getMediaUrl(ref);
    }
  }

  return { ...(data as any), avatar_url, cover_url } as OnboardingProfile;
}

export async function saveOnboarding(
  userId: string,
  patch: Partial<OnboardingProfile>,
): Promise<void> {
  const allowed: (keyof OnboardingProfile)[] = [
    "professional_name",
    "business_name",
    "description",
    "whatsapp",
    "city",
    "state",
    "years_experience",
    "service_types",
    "search_tags",
    "onboarding_step",
    "instagram_username",
    "instagram_url",
    "facebook_url",
    "website_url",
    "formatted_address",
    "postal_code",
    "street",
    "address_number",
    "address_complement",
    "address_reference",
    "neighborhood",
    "country",
    "latitude",
    "longitude",
    "google_place_id",
    "service_radius_km",
    "serves_at_business_address",
    "serves_at_customer_location",
    "serves_remotely",
    "public_address_visibility",
  ];
  const payload: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in patch) payload[k as string] = (patch as any)[k];
  }
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase
    .from("professional_profiles")
    .update(payload as never)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function publishOnboarding(userId: string) {
  const { error } = await supabase
    .from("professional_profiles")
    .update({
      profile_status: "published",
      onboarding_step: 5,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) throw error;
}
