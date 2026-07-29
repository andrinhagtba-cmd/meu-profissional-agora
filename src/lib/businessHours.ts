// Horário de funcionamento — utilitários (fuso America/Sao_Paulo).

export const TZ = "America/Sao_Paulo";

export type BusinessHourDay = {
  weekday: number; // 0 = domingo … 6 = sábado
  is_closed: boolean;
  is_24h: boolean;
  open_time: string | null; // "HH:MM"
  close_time: string | null;
  break_start: string | null;
  break_end: string | null;
};

export const WEEKDAY_LABEL = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export function emptyWeek(): BusinessHourDay[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    is_closed: weekday === 0,
    is_24h: false,
    open_time: weekday === 0 ? null : "08:00",
    close_time: weekday === 0 ? null : "18:00",
    break_start: null,
    break_end: null,
  }));
}

/** Normaliza "HH:MM:SS" ou "HH:MM" para "HH:MM". */
export function hhmm(v: string | null | undefined): string | null {
  if (!v) return null;
  const m = v.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

function toMinutes(v: string | null): number | null {
  const t = hhmm(v);
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Data/hora atual no fuso de Brasília. */
export function nowInBrasilia(date = new Date()): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekday = map[get("weekday")] ?? 0;
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return { weekday, minutes: hour * 60 + minute };
}

export type OpenStatus = {
  open: boolean;
  /** Texto do próximo horário relevante (abertura ou fechamento). */
  nextLabel: string | null;
};

function dayOpen(day: BusinessHourDay | undefined, minutes: number): boolean {
  if (!day || day.is_closed) return false;
  if (day.is_24h) return true;
  const open = toMinutes(day.open_time);
  const close = toMinutes(day.close_time);
  if (open == null || close == null) return false;
  const inRange = close > open ? minutes >= open && minutes < close : minutes >= open || minutes < close;
  if (!inRange) return false;
  const bs = toMinutes(day.break_start);
  const be = toMinutes(day.break_end);
  if (bs != null && be != null && minutes >= bs && minutes < be) return false;
  return true;
}

export function computeStatus(week: BusinessHourDay[], date = new Date()): OpenStatus {
  const byDay = new Map(week.map((d) => [d.weekday, d]));
  const { weekday, minutes } = nowInBrasilia(date);
  const today = byDay.get(weekday);

  if (dayOpen(today, minutes)) {
    const bs = toMinutes(today?.break_start ?? null);
    if (today && !today.is_24h) {
      if (bs != null && minutes < bs) {
        return { open: true, nextLabel: `Pausa às ${hhmm(today.break_start)}` };
      }
      const close = hhmm(today.close_time);
      if (close) return { open: true, nextLabel: `Fecha às ${close}` };
    }
    return { open: true, nextLabel: "Aberto 24 horas" };
  }

  // Ainda abre hoje?
  if (today && !today.is_closed) {
    const open = toMinutes(today.open_time);
    const be = toMinutes(today.break_end);
    const bs = toMinutes(today.break_start);
    if (bs != null && be != null && minutes >= bs && minutes < be) {
      return { open: false, nextLabel: `Reabre hoje às ${hhmm(today.break_end)}` };
    }
    if (open != null && minutes < open) {
      return { open: false, nextLabel: `Abre hoje às ${hhmm(today.open_time)}` };
    }
  }

  for (let i = 1; i <= 7; i++) {
    const d = byDay.get((weekday + i) % 7);
    if (!d || d.is_closed) continue;
    const label = d.is_24h ? "00:00" : hhmm(d.open_time);
    if (!label) continue;
    const dayName = i === 1 ? "amanhã" : WEEKDAY_LABEL[d.weekday].toLowerCase();
    return { open: false, nextLabel: `Abre ${dayName} às ${label}` };
  }
  return { open: false, nextLabel: null };
}

export function dayLabel(day: BusinessHourDay): string {
  if (day.is_closed) return "Fechado";
  if (day.is_24h) return "Aberto 24 horas";
  const open = hhmm(day.open_time);
  const close = hhmm(day.close_time);
  if (!open || !close) return "Não informado";
  const bs = hhmm(day.break_start);
  const be = hhmm(day.break_end);
  if (bs && be) return `${open}–${bs} · ${be}–${close}`;
  return `${open}–${close}`;
}

export function hasAnyHours(week: BusinessHourDay[] | null | undefined): boolean {
  if (!week?.length) return false;
  return week.some((d) => d.is_24h || (!d.is_closed && d.open_time && d.close_time));
}
