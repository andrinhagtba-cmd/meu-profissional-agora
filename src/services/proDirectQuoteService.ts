// Pedidos de orçamento direcionados ao profissional autenticado.
// Consome RPCs SECURITY DEFINER que já validam o vínculo user → professional.
import { supabase } from "@/integrations/supabase/client";

export type ProDirectQuote = {
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
  pro_viewed_at: string | null;
  category_name: string | null;
  category_slug: string | null;
  service_name: string | null;
  client_name: string | null;
};

export type ProDirectQuoteDetail = ProDirectQuote & {
  service_slug: string | null;
  preferred_date: string | null;
  client_id: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_city: string | null;
};

export async function listProDirectQuotes(): Promise<ProDirectQuote[]> {
  const { data, error } = await supabase.rpc("list_pro_direct_quotes");
  if (error) throw error;
  return (data ?? []) as ProDirectQuote[];
}

export async function getProDirectQuote(id: string): Promise<ProDirectQuoteDetail | null> {
  const { data, error } = await supabase.rpc("get_pro_direct_quote", { _id: id });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as ProDirectQuoteDetail) ?? null;
}

export async function markProQuoteViewed(id: string): Promise<void> {
  const { error } = await supabase.rpc("mark_pro_quote_viewed", { _id: id });
  if (error) throw error;
}

export async function countProUnreadDirectQuotes(): Promise<number> {
  const { data, error } = await supabase.rpc("count_pro_unread_direct_quotes");
  if (error) throw error;
  return (data as number) ?? 0;
}
