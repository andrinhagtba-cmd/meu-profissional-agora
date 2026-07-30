import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InitialsAvatar } from "@/components/admin/AdminTable";
import { planPeriodLabel } from "@/lib/planPeriod";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  DERIVED_CLASS, DERIVED_LABEL, PAYMENT_METHODS, PAYMENT_STATUS_LABEL,
  daysLabel, paymentMethodLabel, whatsappTemplate,
} from "@/lib/subscriptionStatus";
import {
  activateSubscription, addSubscriptionNote, listSubscriptionEvents,
  listSubscriptionNotifications, logManualNotification, renewSubscription,
  setProfilePublicStatus, setSubscriptionStatus, updateSubscriptionFields,
  type SubscriptionRow,
} from "@/services/subscriptionAdminService";
import { CheckCircle2, MessageCircle, RefreshCw, Ban, PauseCircle, Eye, EyeOff } from "lucide-react";

const brl = (n: number | null | undefined) =>
  (Number(n ?? 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");
const fmtDT = (d?: string | null) => (d ? new Date(d).toLocaleString("pt-BR") : "—");
const toDateInput = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

type Plan = { id: string; name: string; price: number; billing_period: string };

export function SubscriptionDetailDrawer({
  row, plans, onClose,
}: {
  row: SubscriptionRow | null;
  plans: Plan[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    qc.invalidateQueries({ queryKey: ["sub-events"] });
    qc.invalidateQueries({ queryKey: ["sub-notifs"] });
  };

  const [actExpires, setActExpires] = useState("");
  const [actPublish, setActPublish] = useState(true);
  const [renewPlan, setRenewPlan] = useState("");
  const [renewStart, setRenewStart] = useState("");
  const [renewExpires, setRenewExpires] = useState("");
  const [renewAmount, setRenewAmount] = useState("");
  const [renewMethod, setRenewMethod] = useState("pix");
  const [note, setNote] = useState("");

  const { data: events } = useQuery({
    queryKey: ["sub-events", row?.id],
    queryFn: () => listSubscriptionEvents(row!.id),
    enabled: !!row,
  });
  const { data: notifs } = useQuery({
    queryKey: ["sub-notifs", row?.id],
    queryFn: () => listSubscriptionNotifications(row!.id),
    enabled: !!row,
  });

  const company = row?.professional?.business_name || row?.professional?.professional_name || "—";

  const waUrl = useMemo(() => {
    if (!row) return null;
    const msg = whatsappTemplate({
      contactName: (row.contact_name ?? "").split(" ")[0] || "tudo bem",
      companyName: company,
      expiresAt: row.expires_at,
    });
    return { url: buildWhatsAppUrl(row.professional?.whatsapp ?? row.contact_phone, msg), msg };
  }, [row, company]);

  const act = useMutation({
    mutationFn: () => activateSubscription({
      id: row!.id,
      expiresAt: actExpires ? new Date(`${actExpires}T12:00:00`).toISOString() : null,
      publishProfile: actPublish,
    }),
    onSuccess: () => { toast.success("Assinatura ativada"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const renew = useMutation({
    mutationFn: () => renewSubscription({
      id: row!.id,
      planId: renewPlan || null,
      startDate: renewStart ? new Date(`${renewStart}T12:00:00`).toISOString() : null,
      expiresAt: renewExpires ? new Date(`${renewExpires}T12:00:00`).toISOString() : null,
      amount: renewAmount ? Number(renewAmount) : null,
      paymentMethod: renewMethod,
      paymentStatus: "paid",
    }),
    onSuccess: () => { toast.success("Assinatura renovada"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const status = useMutation({
    mutationFn: (s: "suspended" | "cancelled" | "active") => setSubscriptionStatus(row!.id, s),
    onSuccess: () => { toast.success("Status atualizado"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const publish = useMutation({
    mutationFn: (v: boolean) => setProfilePublicStatus(row!.professional_id, v),
    onSuccess: () => { toast.success("Visibilidade do perfil atualizada"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveNote = useMutation({
    mutationFn: () => addSubscriptionNote(row!, note),
    onSuccess: () => { toast.success("Observação salva"); setNote(""); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const markContacted = useMutation({
    mutationFn: () => logManualNotification(row!, { channel: "whatsapp", message: waUrl?.msg ?? "", recipient: row!.professional?.whatsapp ?? null }),
    onSuccess: () => { toast.success("Contato registrado"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const fields = useMutation({
    mutationFn: (patch: Parameters<typeof updateSubscriptionFields>[1]) => updateSubscriptionFields(row!.id, patch),
    onSuccess: () => { toast.success("Assinatura atualizada"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!row) return null;

  return (
    <Sheet open={!!row} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="text-left">
          <SheetTitle className="sr-only">Assinatura</SheetTitle>
        </SheetHeader>

        <div className="flex items-center gap-3">
          {row.avatar_url ? (
            <img src={row.avatar_url} alt={company} className="h-12 w-12 rounded-2xl object-cover ring-1 ring-border" />
          ) : (
            <InitialsAvatar name={company} className="h-12 w-12 rounded-2xl" />
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-extrabold">{company}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.professional?.city ?? "—"} · /{row.professional?.slug ?? "—"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <InfoBox label="Plano" value={row.plan?.name ?? "—"} hint={row.plan ? `${brl(row.amount ?? row.plan.price)} · ${planPeriodLabel(row.plan.billing_period)}` : undefined} />
          <InfoBox
            label="Situação"
            value={DERIVED_LABEL[row.derived]}
            hint={daysLabel(row.expires_at)}
            className={DERIVED_CLASS[row.derived]}
          />
          <InfoBox label="Ativação" value={fmt(row.activated_at)} />
          <InfoBox label="Vencimento" value={fmt(row.expires_at)} hint={row.grace_period_end ? `Tolerância até ${fmt(row.grace_period_end)}` : undefined} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {waUrl?.url && (
            <Button asChild size="sm" className="bg-[#25D366] text-white hover:bg-[#1eb857]">
              <a href={waUrl.url} target="_blank" rel="noopener noreferrer" onClick={() => markContacted.mutate()}>
                <MessageCircle size={15} /> Cobrar no WhatsApp
              </a>
            </Button>
          )}
          {row.professional?.profile_status === "published" ? (
            <Button size="sm" variant="outline" onClick={() => publish.mutate(false)}>
              <EyeOff size={15} /> Ocultar perfil
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => publish.mutate(true)}>
              <Eye size={15} /> Publicar perfil
            </Button>
          )}
          {row.status !== "suspended" && (
            <Button size="sm" variant="outline" onClick={() => status.mutate("suspended")}>
              <PauseCircle size={15} /> Suspender
            </Button>
          )}
          {row.status !== "cancelled" && (
            <Button size="sm" variant="outline" className="text-rose-600" onClick={() => status.mutate("cancelled")}>
              <Ban size={15} /> Cancelar
            </Button>
          )}
        </div>

        <Tabs defaultValue="gerir" className="mt-5">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 rounded-full bg-muted/60 p-1">
            <TabsTrigger value="gerir" className="rounded-full">Gerir</TabsTrigger>
            <TabsTrigger value="dados" className="rounded-full">Dados</TabsTrigger>
            <TabsTrigger value="historico" className="rounded-full">Histórico</TabsTrigger>
            <TabsTrigger value="alertas" className="rounded-full">Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="gerir" className="space-y-5 pt-4">
            {row.status !== "active" && (
              <section className="admin-card space-y-3 p-4">
                <p className="font-display text-sm font-bold">Ativar assinatura</p>
                <p className="text-xs text-muted-foreground">
                  A contagem começa hoje. Deixe o vencimento em branco para calcular automaticamente pelo período do plano.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Vencimento (opcional)</Label>
                    <Input type="date" value={actExpires} onChange={(e) => setActExpires(e.target.value)} />
                  </div>
                  <div className="flex items-end gap-2 pb-1">
                    <Switch checked={actPublish} onCheckedChange={setActPublish} id="pub" />
                    <Label htmlFor="pub" className="text-xs">Publicar perfil no site</Label>
                  </div>
                </div>
                <Button size="sm" onClick={() => act.mutate()} disabled={act.isPending}>
                  <CheckCircle2 size={15} /> Confirmar pagamento e ativar
                </Button>
              </section>
            )}

            <section className="admin-card space-y-3 p-4">
              <p className="font-display text-sm font-bold">Renovar</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Plano</Label>
                  <Select value={renewPlan || row.plan_id} onValueChange={setRenewPlan}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — {brl(p.price)} {planPeriodLabel(p.billing_period)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Início</Label>
                  <Input type="date" value={renewStart} onChange={(e) => setRenewStart(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Novo vencimento (opcional)</Label>
                  <Input type="date" value={renewExpires} onChange={(e) => setRenewExpires(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Valor pago</Label>
                  <Input type="number" step="0.01" placeholder={String(row.plan?.price ?? "")} value={renewAmount} onChange={(e) => setRenewAmount(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Forma de pagamento</Label>
                  <Select value={renewMethod} onValueChange={setRenewMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => renew.mutate()} disabled={renew.isPending}>
                <RefreshCw size={15} /> Registrar renovação
              </Button>
            </section>

            <section className="admin-card space-y-3 p-4">
              <p className="font-display text-sm font-bold">Observações internas</p>
              {row.notes && <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">{row.notes}</p>}
              <Textarea rows={3} placeholder="Ex: cliente pediu boleto para o dia 10." value={note} onChange={(e) => setNote(e.target.value)} />
              <Button size="sm" variant="outline" onClick={() => saveNote.mutate()} disabled={!note.trim() || saveNote.isPending}>
                Salvar observação
              </Button>
            </section>
          </TabsContent>

          <TabsContent value="dados" className="space-y-3 pt-4">
            <div className="admin-card grid gap-3 p-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Vencimento</Label>
                <Input
                  type="date" defaultValue={toDateInput(row.expires_at)}
                  onBlur={(e) => e.target.value && fields.mutate({ expires_at: new Date(`${e.target.value}T12:00:00`).toISOString() })}
                />
              </div>
              <div>
                <Label className="text-xs">Valor cobrado</Label>
                <Input
                  type="number" step="0.01" defaultValue={row.amount ?? ""}
                  onBlur={(e) => fields.mutate({ amount: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div>
                <Label className="text-xs">Forma de pagamento</Label>
                <Select defaultValue={row.payment_method ?? undefined} onValueChange={(v) => fields.mutate({ payment_method: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status do pagamento</Label>
                <Select defaultValue={row.payment_status} onValueChange={(v) => fields.mutate({ payment_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_STATUS_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch checked={row.auto_renew} onCheckedChange={(v) => fields.mutate({ auto_renew: v })} id="ar" />
                <Label htmlFor="ar" className="text-xs">Renovação automática combinada com o cliente</Label>
              </div>
            </div>
            <div className="admin-card space-y-1 p-4 text-xs text-muted-foreground">
              <p><strong className="text-foreground">Contato:</strong> {row.contact_name ?? "—"}</p>
              <p><strong className="text-foreground">E-mail:</strong> {row.contact_email ?? "—"}</p>
              <p><strong className="text-foreground">WhatsApp:</strong> {row.professional?.whatsapp ?? row.contact_phone ?? "—"}</p>
              <p><strong className="text-foreground">Pagamento:</strong> {paymentMethodLabel(row.payment_method)} · {PAYMENT_STATUS_LABEL[row.payment_status] ?? row.payment_status}</p>
            </div>
          </TabsContent>

          <TabsContent value="historico" className="space-y-2 pt-4">
            {(events ?? []).length === 0 && <p className="text-sm text-muted-foreground">Sem eventos ainda.</p>}
            {(events ?? []).map((e) => (
              <div key={e.id} className="admin-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold capitalize">{e.event_type.replace(/_/g, " ")}</span>
                  <span className="text-[11px] text-muted-foreground">{fmtDT(e.created_at)}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {e.from_status ? `${e.from_status} → ${e.to_status ?? "—"}` : e.to_status ?? ""}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="alertas" className="space-y-2 pt-4">
            {(notifs ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum alerta enviado.</p>}
            {(notifs ?? []).map((n) => (
              <div key={n.id} className="admin-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
                    {n.offset_days > 0 ? `D-${n.offset_days}` : n.offset_days === 0 ? "No vencimento" : `D+${Math.abs(n.offset_days)}`} · {n.channel}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{fmtDT(n.created_at)}</span>
                </div>
                {n.message && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function InfoBox({ label, value, hint, className }: { label: string; value: string; hint?: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border/60 p-3 ring-1 ring-inset ring-transparent ${className ?? "bg-muted/30"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-0.5 text-sm font-bold">{value}</p>
      {hint && <p className="text-[11px] opacity-80">{hint}</p>}
    </div>
  );
}
