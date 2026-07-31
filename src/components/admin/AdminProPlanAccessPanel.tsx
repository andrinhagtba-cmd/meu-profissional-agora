import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, Copy, Info, KeyRound, Loader2, Mail, MessageCircle, RefreshCw, Trash2, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/admin/AdminTable";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  listPlansAdmin, getProSubscriptions, assignProSubscription, deleteProSubscription,
} from "@/services/adminService";
import { createProAccessFn, resetProPasswordFn, updateProEmailFn, getProAccountDetailsFn } from "@/lib/proAccess.functions";
import { addPlanPeriod, planPeriodLabel, planPeriodSuffix } from "@/lib/planPeriod";

const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const day = (d?: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");
const dateTime = (d?: string | null) => (d ? new Date(d).toLocaleString("pt-BR") : "—");
const todayISO = () => new Date().toISOString().slice(0, 10);


const addPeriod = (start: string, billing: string) => addPlanPeriod(start, billing);

const SUB_STATUS_LABEL: Record<string, string> = {
  active: "Ativa", pending: "Pendente", cancelled: "Cancelada", expired: "Expirada",
};

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success", pending: "warning", cancelled: "danger", expired: "neutral",
};

export function AdminProPlanAccessPanel({
  professionalId,
  userId,
  accountEmail,
  displayName,
  whatsapp,
}: {
  professionalId: string;
  userId: string | null;
  accountEmail: string | null;
  displayName: string;
  whatsapp?: string | null;
}) {
  const qc = useQueryClient();

  const { data: plans } = useQuery({ queryKey: ["admin-plans"], queryFn: listPlansAdmin });
  const { data: subs, isLoading } = useQuery({
    queryKey: ["admin-pro-subs", professionalId],
    queryFn: () => getProSubscriptions(professionalId),
  });

  const current = subs?.find((s) => s.status === "active") ?? subs?.[0] ?? null;

  const [planId, setPlanId] = useState("");
  const [status, setStatus] = useState<"active" | "pending" | "cancelled" | "expired">("active");
  const [startsAt, setStartsAt] = useState(todayISO());
  const [endsAt, setEndsAt] = useState("");

  const selectedPlan = useMemo(() => plans?.find((p) => p.id === planId) ?? null, [plans, planId]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-pro-subs", professionalId] });
    qc.invalidateQueries({ queryKey: ["admin-subs"] });
  };

  const saveSub = useMutation({
    mutationFn: () =>
      assignProSubscription({
        professional_id: professionalId,
        plan_id: planId,
        status,
        started_at: new Date(`${startsAt}T12:00:00`).toISOString(),
        expires_at: endsAt ? new Date(`${endsAt}T12:00:00`).toISOString() : null,
      }),
    onSuccess: () => { toast.success("Plano atribuído ao profissional"); setPlanId(""); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSub = useMutation({
    mutationFn: (id: string) => deleteProSubscription(id),
    onSuccess: () => { toast.success("Assinatura removida"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  // ----- credenciais -----
  const [email, setEmail] = useState(accountEmail ?? "");
  const [password, setPassword] = useState("");
  const [generated, setGenerated] = useState<{ email: string; password: string } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const details = useQuery({
    queryKey: ["admin-pro-account", userId],
    queryFn: () => getProAccountDetailsFn({ data: { userId: userId! } }),
    enabled: !!userId && showDetails,
  });

  const createAccess = useMutation({
    mutationFn: () =>
      createProAccessFn({ data: { professionalId, email, password: password || null, fullName: displayName } }),
    onSuccess: (r) => {
      toast.success(r.created ? "Acesso criado com sucesso" : "Conta vinculada ao profissional");
      if (r.password) setGenerated({ email: r.email, password: r.password });
      setPassword("");
      qc.invalidateQueries({ queryKey: ["admin-pro-detail", professionalId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetPass = useMutation({
    mutationFn: () => resetProPasswordFn({ data: { userId: userId!, password: password || null } }),
    onSuccess: (r) => {
      toast.success("Senha redefinida");
      setGenerated({ email: accountEmail ?? email, password: r.password });
      setPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateEmail = useMutation({
    mutationFn: () => updateProEmailFn({ data: { userId: userId!, email } }),
    onSuccess: (r) => {
      toast.success("E-mail de acesso atualizado");
      setEmail(r.email);
      qc.invalidateQueries({ queryKey: ["admin-pro-detail", professionalId] });
      qc.invalidateQueries({ queryKey: ["admin-pro-account", userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const makePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let out = "";
    const buf = new Uint32Array(12);
    (globalThis.crypto ?? window.crypto).getRandomValues(buf);
    for (const n of buf) out += chars[n % chars.length];
    return out;
  };

  const waDigits = (whatsapp ?? "").replace(/\D/g, "");
  const waNumber = waDigits ? (waDigits.length <= 11 ? `55${waDigits}` : waDigits) : "";

  const openWhatsApp = () => {
    if (!generated || !waNumber) return;
    const msg = [
      `Ola, ${displayName}!`,
      "",
      "Seus dados de acesso ao painel do Guia DF na Midia foram criados.",
      "",
      "Site: https://guiadfnamidia.com.br/",
      `Login: ${generated.email}`,
      `Senha: ${generated.password}`,
      "",
      "Acesse com esses dados e recomendamos alterar a senha apos o primeiro acesso.",
      "Guarde essas informacoes em local seguro e nao compartilhe com terceiros.",
    ].join("\n");
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  };

  const copy = (text: string) => {
    if (typeof window === "undefined") return;
    window.navigator.clipboard.writeText(text);
    toast.success("Copiado");
  };


  return (
    <div className="space-y-5">
      <Card className="rounded-[1.7rem] shadow-card">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 font-display text-xl font-extrabold tracking-normal">
            <WalletCards size={18} className="text-primary" /> Plano do profissional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <div className="rounded-2xl border bg-background p-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando assinatura…</p>
            ) : current ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-display text-lg font-extrabold text-foreground">
                    {current.plan?.name ?? "Plano removido"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {current.plan ? `${brl(current.plan.price)} · ${planPeriodLabel(current.plan.billing_period)}` : "—"}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarClock size={14} /> Período: {day(current.started_at)} → {day(current.expires_at) === "—" ? "sem vencimento" : day(current.expires_at)}
                  </div>
                </div>
                <StatusPill tone={STATUS_TONE[current.status] ?? "neutral"}>{SUB_STATUS_LABEL[current.status] ?? current.status}</StatusPill>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum plano atribuído a este profissional.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select
                value={planId}
                onValueChange={(v) => {
                  setPlanId(v);
                  const p = plans?.find((x) => x.id === v);
                  if (p) setEndsAt(addPeriod(startsAt, p.billing_period));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
                <SelectContent>
                  {(plans ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} · {brl(p.price)}{planPeriodSuffix(p.billing_period)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Situação</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="expired">Expirada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Início do período</Label>
              <Input
                type="date" value={startsAt}
                onChange={(e) => {
                  setStartsAt(e.target.value);
                  if (selectedPlan) setEndsAt(addPeriod(e.target.value, selectedPlan.billing_period));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fim do período (vencimento)</Label>
              <Input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="rounded-full" disabled={!planId || saveSub.isPending} onClick={() => saveSub.mutate()}>
              {saveSub.isPending && <Loader2 size={14} className="animate-spin" />} Atribuir plano
            </Button>
            {selectedPlan && (
              <Button variant="outline" className="rounded-full" onClick={() => setEndsAt(addPeriod(startsAt, selectedPlan.billing_period))}>
                Recalcular vencimento
              </Button>
            )}
          </div>

          {(subs?.length ?? 0) > 0 && (
            <div className="space-y-2 border-t pt-4">
              <div className="text-[11px] font-bold uppercase text-muted-foreground">Histórico de assinaturas</div>
              {subs!.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-background px-4 py-3 text-sm">
                  <div>
                    <span className="font-semibold text-foreground">{s.plan?.name ?? "—"}</span>
                    <span className="ml-2 text-muted-foreground">{day(s.started_at)} → {day(s.expires_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone={STATUS_TONE[s.status] ?? "neutral"}>{s.status}</StatusPill>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeSub.mutate(s.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[1.7rem] shadow-card">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 font-display text-xl font-extrabold tracking-normal">
            <KeyRound size={18} className="text-primary" /> Credenciais de acesso ao painel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="rounded-2xl border bg-background p-4 text-sm">
            {userId ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone="success">Conta vinculada</StatusPill>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Mail size={14} /> {accountEmail ?? "sem e-mail"}</span>
                  <Button
                    size="sm" variant="ghost" className="ml-auto rounded-full"
                    onClick={() => setShowDetails((v) => !v)}
                  >
                    <Info size={14} /> {showDetails ? "Ocultar detalhes" : "Ver detalhes da conta"}
                  </Button>
                </div>

                {showDetails && (
                  <div className="rounded-xl border bg-card p-3">
                    {details.isLoading ? (
                      <p className="text-xs text-muted-foreground">Carregando detalhes…</p>
                    ) : details.error ? (
                      <p className="text-xs text-destructive">{(details.error as Error).message}</p>
                    ) : details.data ? (
                      <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                        <Detail label="ID do usuário" value={details.data.userId} mono />
                        <Detail label="E-mail" value={details.data.email ?? "—"} />
                        <Detail label="E-mail confirmado" value={details.data.emailConfirmed ? "Sim" : "Não"} />
                        <Detail label="Provedor" value={details.data.provider} />
                        <Detail label="Nome no perfil" value={details.data.fullName ?? "—"} />
                        <Detail label="Telefone" value={details.data.phone ?? "—"} />
                        <Detail
                          label="Localização"
                          value={details.data.city ? `${details.data.city}${details.data.state ? `/${details.data.state}` : ""}` : "—"}
                        />
                        <Detail label="Status da conta" value={details.data.accountStatus ?? "—"} />
                        <Detail label="Papéis" value={details.data.roles.join(", ") || "—"} />
                        <Detail label="Criada em" value={dateTime(details.data.createdAt)} />
                        <Detail label="Último acesso" value={dateTime(details.data.lastSignInAt)} />
                      </dl>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone="warning">Sem acesso</StatusPill>
                <span className="text-muted-foreground">Crie as credenciais a partir do e-mail para o profissional acessar o painel.</span>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>E-mail de acesso</Label>
              <Input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="profissional@email.com"
              />
              {userId && (
                <p className="text-xs text-muted-foreground">
                  Alterar o e-mail atualiza o login da conta vinculada.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Senha (opcional — gerada automaticamente)</Label>
              <div className="flex gap-2">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Deixe vazio para gerar" />
                <Button type="button" variant="outline" className="shrink-0 rounded-full" onClick={() => setPassword(makePassword())}>
                  <RefreshCw size={14} /> Gerar
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!userId ? (
              <Button className="rounded-full" disabled={!email || createAccess.isPending} onClick={() => createAccess.mutate()}>
                {createAccess.isPending && <Loader2 size={14} className="animate-spin" />} Criar acesso do profissional
              </Button>
            ) : (
              <>
                <Button variant="outline" className="rounded-full" disabled={resetPass.isPending} onClick={() => resetPass.mutate()}>
                  {resetPass.isPending && <Loader2 size={14} className="animate-spin" />} Redefinir senha
                </Button>
                <Button
                  variant="outline" className="rounded-full"
                  disabled={
                    updateEmail.isPending ||
                    !email ||
                    email.trim().toLowerCase() === (accountEmail ?? "").toLowerCase()
                  }
                  onClick={() => updateEmail.mutate()}
                >
                  {updateEmail.isPending && <Loader2 size={14} className="animate-spin" />} Salvar novo e-mail
                </Button>
              </>
            )}
          </div>

          {generated && (
            <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <div className="font-semibold text-foreground">Credenciais geradas — copie e envie ao profissional</div>
              <div className="flex items-center justify-between gap-2 rounded-xl bg-card px-3 py-2">
                <span className="break-all">{generated.email}</span>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copy(generated.email)}><Copy size={14} /></Button>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-xl bg-card px-3 py-2">
                <span className="font-mono">{generated.password}</span>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copy(generated.password)}><Copy size={14} /></Button>
              </div>
              {waNumber ? (
                <Button type="button" className="rounded-full bg-[#25D366] text-white hover:bg-[#1fb457]" onClick={openWhatsApp}>
                  <MessageCircle size={14} /> Enviar credenciais no WhatsApp
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">Cadastre o WhatsApp no perfil para enviar as credenciais por lá.</p>
              )}
              <p className="text-xs text-muted-foreground">A senha não poderá ser exibida novamente.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`break-all font-medium text-foreground ${mono ? "font-mono text-[11px]" : ""}`}>{value}</dd>
    </div>
  );
}

