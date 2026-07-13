import { supabase } from "@/integrations/supabase/client";

export type ProViewStats = {
  initial_count: number;
  real_count: number;
  public_total: number;
  views_7d: number;
  views_30d: number;
  views_today: number;
};

export async function getProfessionalViewStats(professionalId: string): Promise<ProViewStats | null> {
  const { data, error } = await supabase.rpc("get_professional_view_stats", { p_professional_id: professionalId });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    initial_count: Number(row.initial_count ?? 0),
    real_count: Number(row.real_count ?? 0),
    public_total: Number(row.public_total ?? 0),
    views_7d: Number(row.views_7d ?? 0),
    views_30d: Number(row.views_30d ?? 0),
    views_today: Number(row.views_today ?? 0),
  };
}

export async function adminSetInitialViewCount(professionalId: string, value: number, reason?: string) {
  const { error } = await supabase.rpc("admin_set_initial_view_count", {
    p_professional_id: professionalId,
    p_value: value,
    p_reason: reason ?? undefined,
  });
  if (error) throw error;
}
