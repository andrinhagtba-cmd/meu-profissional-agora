// Dados da "loja"/perfil profissional editáveis pelo próprio profissional.
// RLS: "pro update own" permite ao dono (user_id = auth.uid()) atualizar.

import { supabase } from "@/integrations/supabase/client";

const STORE_FIELDS = `
  id, user_id, slug, professional_name, business_name, description, whatsapp,
  years_experience, starting_price, price_label, response_time, availability_status,
  emergency, service_types, search_tags, instagram_username, instagram_url,
  facebook_url, website_url, postal_code, street, address_number, address_complement,
  address_reference, neighborhood, city, state, location_label, formatted_address,
  latitude, longitude, google_place_id, public_address_visibility, service_radius_km,
  service_regions, serves_at_business_address, serves_at_customer_location,
  serves_remotely, profile_status, verification_status, updated_at
`;

export type MyStoreProfile = {
  id: string;
  user_id: string | null;
  slug: string | null;
  professional_name: string | null;
  business_name: string | null;
  description: string | null;
  whatsapp: string | null;
  years_experience: number | null;
  starting_price: number | null;
  price_label: string | null;
  response_time: string | null;
  availability_status: string | null;
  emergency: boolean | null;
  service_types: string[] | null;
  search_tags: string[] | null;
  instagram_username: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  website_url: string | null;
  postal_code: string | null;
  street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_reference: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  location_label: string | null;
  formatted_address: string | null;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string | null;
  public_address_visibility: string | null;
  service_radius_km: number | null;
  service_regions: string[] | null;
  serves_at_business_address: boolean | null;
  serves_at_customer_location: boolean | null;
  serves_remotely: boolean | null;
  profile_status: string | null;
  verification_status: string | null;
  updated_at: string | null;
};

export type MyStorePatch = Partial<Omit<MyStoreProfile, "id" | "user_id" | "updated_at" | "verification_status">>;

export async function getMyStoreProfile(userId: string): Promise<MyStoreProfile | null> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select(STORE_FIELDS)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as MyStoreProfile | null) ?? null;
}

export async function updateMyStoreProfile(id: string, patch: MyStorePatch) {
  const { error } = await supabase
    .from("professional_profiles")
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}
