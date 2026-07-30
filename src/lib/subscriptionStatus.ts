import { customPeriodDays } from "@/lib/planPeriod";

export type DerivedStatus =
  | "pending"
  | "active"
  | "due_30"
  | "due_15"
  | "due_7"
  | "due_today"
  | "expired"
  | "suspended"
  | "cancelled";

export const DERIVED_LABEL: Record<DerivedStatus, string> = {
  pending: "Aguardando ativação",
  active: "Ativa",
  due_30: "Vence em 30 dias",
  due_15: "Vence em 15 dias",
  due_7: "Vence em 7 dias",
  due_today: "Vence hoje",
  expired: "Vencida",
  suspended: "Suspensa",
  cancelled: "Cancelada",
};

/** Classes de cor por status derivado (verde/amarelo/laranja/vermelho/cinza/roxo). */
export const DERIVED_CLASS: Record<DerivedStatus, string> = {
  pending: "bg-violet-50 text-violet-700 ring-violet-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  due_30: "bg-amber-50 text-amber-700 ring-amber-200",
  due_15: "bg-orange-50 text-orange-700 ring-orange-200",
  due_7: "bg-orange-100 text-orange-800 ring-orange-300",
  due_today: "bg-rose-100 text-rose-800 ring-rose-300",
  expired: "bg-rose-50 text-rose-700 ring-rose-200",
  suspended: "bg-slate-100 text-slate-700 ring-slate-300",
  cancelled: "bg-zinc-100 text-zinc-600 ring-zinc-300",
};

const DAY = 86_400_000;

/** Dias inteiros restantes até o vencimento (negativo = atraso). null quando sem vencimento. */
export function daysUntil(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const t = new Date(expiresAt).getTime();
  if (Number.isNaN(t)) return null;
  const today = new Date();
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const d = new Date(t);
  const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b - a) / DAY);
}

export function daysLabel(expiresAt: string | null | undefined): string {
  const d = daysUntil(expiresAt);
  if (d === null) return "Sem vencimento";
  if (d === 0) return "Vence hoje";
  if (d > 0) return `${d} ${d === 1 ? "dia restante" : "dias restantes"}`;
  return `Vencida há ${Math.abs(d)} ${Math.abs(d) === 1 ? "dia" : "dias"}`;
}

export function derivedStatus(row: {
  status: string;
  expires_at: string | null;
  activated_at?: string | null;
}): DerivedStatus {
  if (row.status === "cancelled") return "cancelled";
  if (row.status === "suspended") return "suspended";
  if (row.status === "pending" || !row.activated_at) {
    if (row.status !== "active" && row.status !== "expired") return "pending";
  }
  const d = daysUntil(row.expires_at);
  if (row.status === "expired") return "expired";
  if (d === null) return "active";
  if (d < 0) return "expired";
  if (d === 0) return "due_today";
  if (d <= 7) return "due_7";
  if (d <= 15) return "due_15";
  if (d <= 30) return "due_30";
  return "active";
}

/** Receita mensal equivalente de um plano. */
export function monthlyValue(price: number, billingPeriod: string | null | undefined): number {
  const p = (billingPeriod ?? "").toLowerCase();
  const days = customPeriodDays(p);
  if (days) return (price / days) * 30;
  if (p.includes("year") || p.includes("anual")) return price / 12;
  if (p.includes("semi") || p.includes("semes")) return price / 6;
  if (p.includes("quarter") || p.includes("trimes")) return price / 3;
  if (p.includes("week") || p.includes("semana")) return price * 4.345;
  if (p === "one_time" || p === "custom") return 0;
  return price;
}

export const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "boleto", label: "Boleto" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "transfer", label: "Transferência" },
  { value: "cash", label: "Dinheiro" },
  { value: "other", label: "Outro" },
];

export const paymentMethodLabel = (v?: string | null) =>
  PAYMENT_METHODS.find((m) => m.value === v)?.label ?? (v ? v : "—");

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pagamento pendente",
  paid: "Pago",
  refunded: "Estornado",
  failed: "Falhou",
};

export function whatsappTemplate(opts: {
  contactName: string;
  companyName: string;
  expiresAt: string | null;
}) {
  const date = opts.expiresAt ? new Date(opts.expiresAt).toLocaleDateString("pt-BR") : "";
  const d = daysUntil(opts.expiresAt);
  if (d !== null && d < 0) {
    return `Olá, ${opts.contactName}. Identificamos que a assinatura da empresa ${opts.companyName} venceu em ${date}. Podemos ajudar com a renovação para manter o perfil ativo no Guia DF na Mídia?`;
  }
  if (d !== null) {
    return `Olá, ${opts.contactName}. Tudo bem? A assinatura da empresa ${opts.companyName} no Guia DF na Mídia vence em ${date}. Gostaria de conversar sobre a renovação do seu plano?`;
  }
  return `Olá, ${opts.contactName}. Tudo bem? Sou do Guia DF na Mídia e gostaria de falar sobre o plano da empresa ${opts.companyName}.`;
}
