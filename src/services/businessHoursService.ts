import { supabase } from "@/integrations/supabase/client";
import { supabasePublic } from "@/integrations/supabase/publicClient";
import { emptyWeek, hhmm, type BusinessHourDay } from "@/lib/businessHours";

type Row = {
  weekday: number;
  is_closed: boolean;
  is_24h: boolean;
  open_time: string | null;
  close_time: string | null;
  break_start: string | null;
  break_end: string | null;
};

function toWeek(rows: Row[]): BusinessHourDay[] {
  if (!rows.length) return [];
  const base = emptyWeek().map((d) => ({ ...d, is_closed: true, open_time: null, close_time: null }));
  rows.forEach((r) => {
    base[r.weekday] = {
      weekday: r.weekday,
      is_closed: Boolean(r.is_closed),
      is_24h: Boolean(r.is_24h),
      open_time: hhmm(r.open_time),
      close_time: hhmm(r.close_time),
      break_start: hhmm(r.break_start),
      break_end: hhmm(r.break_end),
    };
  });
  return base;
}

const SELECT = "weekday, is_closed, is_24h, open_time, close_time, break_start, break_end";

/** Leitura pública (perfis publicados). */
export async function getPublicBusinessHours(professionalId: string): Promise<BusinessHourDay[]> {
  const { data, error } = await supabasePublic
    .from("professional_business_hours")
    .select(SELECT)
    .eq("professional_id", professionalId)
    .order("weekday");
  if (error) throw error;
  return toWeek((data ?? []) as unknown as Row[]);
}

/** Leitura autenticada (dono ou admin). */
export async function getBusinessHours(professionalId: string): Promise<BusinessHourDay[]> {
  const { data, error } = await supabase
    .from("professional_business_hours")
    .select(SELECT)
    .eq("professional_id", professionalId)
    .order("weekday");
  if (error) throw error;
  const rows = (data ?? []) as unknown as Row[];
  return rows.length ? toWeek(rows) : emptyWeek();
}

export async function saveBusinessHours(
  professionalId: string,
  week: BusinessHourDay[],
): Promise<void> {
  const payload = week.map((d) => ({
    professional_id: professionalId,
    weekday: d.weekday,
    is_closed: d.is_closed,
    is_24h: d.is_24h,
    open_time: d.is_closed || d.is_24h ? null : (d.open_time || null),
    close_time: d.is_closed || d.is_24h ? null : (d.close_time || null),
    break_start: d.is_closed || d.is_24h ? null : (d.break_start || null),
    break_end: d.is_closed || d.is_24h ? null : (d.break_end || null),
  }));
  const { error } = await supabase
    .from("professional_business_hours")
    .upsert(payload as never, { onConflict: "professional_id,weekday" });
  if (error) throw error;
}

export async function saveHolidayNote(professionalId: string, note: string | null): Promise<void> {
  const { error } = await supabase
    .from("professional_profiles")
    .update({ holiday_note: note } as never)
    .eq("id", professionalId);
  if (error) throw error;
}
