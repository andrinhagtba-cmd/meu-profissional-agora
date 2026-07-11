// Camada de dados para o painel do PROFISSIONAL:
// perfil (professional_profiles), leads (quote_requests abertos),
// propostas enviadas (quote_proposals) e serviços oferecidos
// (professional_services).

import { supabase } from "@/integrations/supabase/client";

export type ProProfile = {
  id: string;
  user_id: string | null;
  slug: string | null;
  professional_name: string | null;
  business_name: string | null;
  description: string | null;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  years_experience: number | null;
  starting_price: number | null;
  response_time: string | null;
  average_rating: number | null;
  reviews_count: number | null;
  verification_status: string | null;
  availability_status: string | null;
  emergency: boolean | null;
  service_types: string[] | null;
};

export async function getMyProProfile(userId: string): Promise<ProProfile | null> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select(
      `id, user_id, slug, professional_name, business_name, description, whatsapp,
       city, state, years_experience, starting_price, response_time, average_rating,
       reviews_count, verification_status, availability_status, emergency, service_types`,
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProProfile | null) ?? null;
}

export async function updateMyProProfile(
  id: string,
  patch: {
    professional_name?: string | null;
    business_name?: string | null;
    description?: string | null;
    whatsapp?: string | null;
    city?: string | null;
    state?: string | null;
    years_experience?: number | null;
    starting_price?: number | null;
    response_time?: string | null;
    emergency?: boolean;
  },
) {
  const { error } = await supabase.from("professional_profiles").update(patch).eq("id", id);
  if (error) throw error;
}

// --------------------- Leads (pedidos abertos) ---------------------

export type Lead = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  state: string;
  neighborhood: string | null;
  urgency: string;
  service_type: string;
  status: string;
  created_at: string;
  category?: { slug: string; name: string } | null;
};

export async function listOpenLeads(): Promise<Lead[]> {
  // RLS "pros read open quotes" já filtra por status open/receiving_proposals
  // e exige o papel profissional.
  const { data, error } = await supabase
    .from("quote_requests")
    .select(
      `id, title, description, city, state, neighborhood, urgency, service_type,
       status, created_at, category:category_id(slug, name)`,
    )
    .in("status", ["open", "receiving_proposals"])
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as Lead[];
}

// --------------------- Propostas enviadas ---------------------

export type MyProposal = {
  id: string;
  quote_request_id: string;
  message: string | null;
  estimated_price: number | null;
  price_type: string | null;
  estimated_deadline: string | null;
  status: string;
  created_at: string;
  quote?: {
    title: string;
    city: string;
    state: string;
    status: string;
  } | null;
};

export async function listMyProposals(professionalId: string): Promise<MyProposal[]> {
  const { data, error } = await supabase
    .from("quote_proposals")
    .select(
      `id, quote_request_id, message, estimated_price, price_type,
       estimated_deadline, status, created_at,
       quote:quote_request_id(title, city, state, status)`,
    )
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MyProposal[];
}

export async function countMyProposals(professionalId: string) {
  const { count, error } = await supabase
    .from("quote_proposals")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", professionalId);
  if (error) throw error;
  return count ?? 0;
}

export async function countLeadsAvailable() {
  const { count, error } = await supabase
    .from("quote_requests")
    .select("id", { count: "exact", head: true })
    .in("status", ["open", "receiving_proposals"]);
  if (error) throw error;
  return count ?? 0;
}

export type SubmitProposalInput = {
  quote_request_id: string;
  professional_id: string;
  message: string;
  estimated_price?: number | null;
  price_type?: "fixed" | "hourly" | "daily" | "per_visit" | "to_quote";
  estimated_deadline?: string;
};

export async function submitProposal(input: SubmitProposalInput) {
  const { data, error } = await supabase
    .from("quote_proposals")
    .insert({
      quote_request_id: input.quote_request_id,
      professional_id: input.professional_id,
      message: input.message,
      estimated_price: input.estimated_price ?? null,
      price_type: input.price_type ?? "to_quote",
      estimated_deadline: input.estimated_deadline ?? null,
      status: "sent",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function withdrawProposal(id: string) {
  const { error } = await supabase
    .from("quote_proposals")
    .update({ status: "withdrawn" })
    .eq("id", id);
  if (error) throw error;
}

// --------------------- Serviços oferecidos ---------------------

export type ProService = {
  id: string;
  professional_id: string;
  service_id: string;
  description: string | null;
  starting_price: number | null;
  price_type: string | null;
  active: boolean;
  service?: {
    name: string;
    slug: string;
    category?: { name: string; slug: string } | null;
  } | null;
};

export async function listMyServices(professionalId: string): Promise<ProService[]> {
  const { data, error } = await supabase
    .from("professional_services")
    .select(
      `id, professional_id, service_id, description, starting_price, price_type, active,
       service:service_id(name, slug, category:category_id(name, slug))`,
    )
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ProService[];
}

export type AvailableService = {
  id: string;
  name: string;
  slug: string;
  category: { id: string; name: string; slug: string } | null;
};

export async function listAllServices(): Promise<AvailableService[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, slug, category:category_id(id, name, slug)")
    .eq("active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as AvailableService[];
}

export async function addMyService(input: {
  professional_id: string;
  service_id: string;
  starting_price?: number | null;
  price_type?: "fixed" | "hourly" | "daily" | "per_visit" | "to_quote";
  description?: string;
}) {
  const { error } = await supabase.from("professional_services").insert({
    professional_id: input.professional_id,
    service_id: input.service_id,
    starting_price: input.starting_price ?? null,
    price_type: input.price_type ?? "to_quote",
    description: input.description ?? null,
    active: true,
  });
  if (error) throw error;
}

export async function toggleMyService(id: string, active: boolean) {
  const { error } = await supabase
    .from("professional_services")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
}

export async function removeMyService(id: string) {
  const { error } = await supabase.from("professional_services").delete().eq("id", id);
  if (error) throw error;
}
