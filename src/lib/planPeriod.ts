export type PlanPeriod =
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "yearly"
  | "one_time"
  | "custom";

export const PLAN_PERIOD_OPTIONS: { value: PlanPeriod; label: string }[] = [
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "semiannual", label: "Semestral" },
  { value: "yearly", label: "Anual" },
  { value: "one_time", label: "Pagamento único" },
  { value: "custom", label: "Personalizado" },
];

const NAMES: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  semestral: "Semestral",
  yearly: "Anual",
  annual: "Anual",
  weekly: "Semanal",
  one_time: "Pagamento único",
  custom: "Personalizado",
};

const SUFFIXES: Record<string, string> = {
  monthly: "/mês",
  quarterly: "/trimestre",
  semiannual: "/semestre",
  semestral: "/semestre",
  yearly: "/ano",
  annual: "/ano",
  weekly: "/semana",
  one_time: " à vista",
  custom: " (personalizado)",
};

/** "Mensal", "Semestral", ... */
export function planPeriodLabel(period?: string | null) {
  const p = (period ?? "").toLowerCase();
  return NAMES[p] ?? (p ? p.replace(/_/g, " ") : "—");
}

/** "/mês", "/semestre", ... */
export function planPeriodSuffix(period?: string | null) {
  const p = (period ?? "").toLowerCase();
  return SUFFIXES[p] ?? (p ? `/${p.replace(/_/g, " ")}` : "");
}

/** Calcula o vencimento a partir da data de início. Retorna "" quando o período é livre. */
export function addPlanPeriod(start: string, period?: string | null): string {
  const p = (period ?? "").toLowerCase();
  if (!start) return "";
  if (p === "one_time" || p === "custom") return "";
  const d = new Date(`${start}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  if (p.includes("year") || p.includes("annual") || p.includes("anual")) d.setFullYear(d.getFullYear() + 1);
  else if (p.includes("semi") || p.includes("semes")) d.setMonth(d.getMonth() + 6);
  else if (p.includes("quarter") || p.includes("trimes")) d.setMonth(d.getMonth() + 3);
  else if (p.includes("week") || p.includes("semana")) d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}
