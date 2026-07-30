import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { planPeriodLabel } from "@/lib/planPeriod";
import { daysLabel, daysUntil, derivedStatus } from "@/lib/subscriptionStatus";

const SUPPORT_PHONE = "5561998662261";

/** Aviso de vencimento da assinatura no painel do profissional. */
export function MySubscriptionBanner({ professionalId }: { professionalId?: string | null }) {
  const { data } = useQuery({
    queryKey: ["my-subscription", professionalId],
    enabled: !!professionalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id, status, activated_at, expires_at, grace_period_end, plan:plan_id(name, price, billing_period)")
        .eq("professional_id", professionalId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!data) return null;

  const derived = derivedStatus(data);
  const d = daysUntil(data.expires_at);
  const warn = ["due_15", "due_7", "due_today", "expired", "suspended", "pending"].includes(derived);
  const plan = data.plan as { name: string; price: number; billing_period: string } | null;

  const msg =
    derived === "expired" || derived === "suspended"
      ? `Olá! Minha assinatura do plano ${plan?.name ?? ""} no Guia DF na Mídia está vencida. Quero renovar.`
      : derived === "pending"
        ? `Olá! Quero ativar meu plano ${plan?.name ?? ""} no Guia DF na Mídia.`
        : `Olá! Quero renovar meu plano ${plan?.name ?? ""} no Guia DF na Mídia (vence em ${d} dias).`;

  const url = buildWhatsAppUrl(SUPPORT_PHONE, msg)!;

  return (
    <div
      className={`mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-5 ${
        warn
          ? "border-orange/30 bg-orange/10"
          : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${warn ? "bg-orange/20 text-orange" : "bg-emerald-100 text-emerald-700"}`}>
          {warn ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
        </span>
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-foreground">
            {derived === "pending"
              ? "Plano aguardando ativação"
              : derived === "expired"
                ? "Sua assinatura venceu"
                : derived === "suspended"
                  ? "Assinatura suspensa"
                  : `Plano ${plan?.name ?? ""} ativo`}
          </p>
          <p className="text-xs text-muted-foreground">
            {plan ? `${planPeriodLabel(plan.billing_period)} · ` : ""}
            {daysLabel(data.expires_at)}
            {data.grace_period_end && derived === "expired"
              ? ` · tolerância até ${new Date(data.grace_period_end).toLocaleDateString("pt-BR")}`
              : ""}
          </p>
        </div>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
      >
        <MessageCircle size={16} />
        {derived === "pending" ? "Ativar plano" : "Renovar no WhatsApp"}
      </a>
    </div>
  );
}
