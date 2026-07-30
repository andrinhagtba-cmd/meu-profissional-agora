import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeCheck, AlarmClock, AlertTriangle, Wallet, MessageCircle,
  RefreshCw, Settings2, Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, InitialsAvatar, type Column } from "@/components/admin/AdminTable";
import { MetricCard } from "@/components/admin/MetricCard";
import { SubscriptionDetailDrawer } from "@/components/admin/SubscriptionDetailDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { planPeriodLabel } from "@/lib/planPeriod";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { DF_REGIONS } from "@/data/dfRegions";
import {
  DERIVED_CLASS, DERIVED_LABEL, daysLabel, daysUntil, whatsappTemplate,
  type DerivedStatus,
} from "@/lib/subscriptionStatus";
import {
  computeMetrics, getProfileStatusCounts, getSubscriptionSettings,
  listSubscriptions, logManualNotification, runLifecycleNow,
  updateSubscriptionSettings, type SubscriptionRow,
} from "@/services/subscriptionAdminService";

export const Route = createFileRoute("/_authenticated/admin/assinaturas")({
  head: () => ({ meta: [{ title: "Assinaturas — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Ativas" },
  { value: "due_30", label: "Vencem em 30d" },
  { value: "due_7", label: "Vencem em 7d" },
  { value: "expired", label: "Vencidas" },
  { value: "pending", label: "Aguardando ativação" },
  { value: "suspended", label: "Suspensas" },
  { value: "cancelled", label: "Canceladas" },
];

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [planId, setPlanId] = useState("all");
  const [region, setRegion] = useState("all");
  const [selected, setSelected] = useState<SubscriptionRow | null>(null);

  const { data: rows, isLoading } = useQuery({ queryKey: ["admin-subscriptions"], queryFn: listSubscriptions });
  const { data: counts } = useQuery({ queryKey: ["admin-sub-counts"], queryFn: getProfileStatusCounts });
  const { data: plans } = useQuery({
    queryKey: ["admin-plans-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("id, name, price, billing_period").order("price");
      if (error) throw error;
      return data ?? [];
    },
  });

  const metrics = useMemo(
    () => computeMetrics(rows ?? [], counts ?? { activeWithoutPlan: 0, deactivated: 0 }),
    [rows, counts],
  );

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (planId !== "all" && r.plan_id !== planId) return false;
      if (region !== "all" && r.professional?.city !== region) return false;
      if (filter !== "all") {
        const d = r.derived;
        const ok =
          filter === "active" ? ["active", "due_30", "due_15", "due_7", "due_today"].includes(d)
          : filter === "due_30" ? ["due_30", "due_15", "due_7", "due_today"].includes(d)
          : filter === "due_7" ? ["due_7", "due_today"].includes(d)
          : d === (filter as DerivedStatus);
        if (!ok) return false;
      }
      if (!s) return true;
      const hay = [
        r.professional?.business_name, r.professional?.professional_name,
        r.professional?.slug, r.professional?.city, r.plan?.name, r.contact_email,
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(s);
    });
  }, [rows, search, filter, planId, region]);

  const lifecycle = useMutation({
    mutationFn: runLifecycleNow,
    onSuccess: (r) => {
      toast.success(`Rotina executada: ${r?.expired ?? 0} vencidas · ${r?.notified ?? 0} alertas · ${r?.deactivated ?? 0} desativadas`);
      qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const contacted = useMutation({
    mutationFn: (row: SubscriptionRow) =>
      logManualNotification(row, {
        channel: "whatsapp",
        message: whatsappTemplate({
          contactName: (row.contact_name ?? "").split(" ")[0] || "tudo bem",
          companyName: row.professional?.business_name || row.professional?.professional_name || "",
          expiresAt: row.expires_at,
        }),
        recipient: row.professional?.whatsapp ?? null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-subscriptions"] }),
  });

  const columns: Column<SubscriptionRow>[] = [
    {
      key: "pro", header: "Empresa",
      cell: (r) => {
        const name = r.professional?.business_name || r.professional?.professional_name || "—";
        return (
          <div className="flex items-center gap-3">
            {r.avatar_url ? (
              <img src={r.avatar_url} alt={name} className="h-9 w-9 rounded-xl object-cover ring-1 ring-border" />
            ) : <InitialsAvatar name={name} />}
            <div className="min-w-0">
              <div className="truncate font-semibold text-foreground">{name}</div>
              <div className="truncate text-xs text-muted-foreground">{r.professional?.city ?? "—"}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "plan", header: "Plano",
      cell: (r) => (
        <div>
          <div className="font-medium text-foreground">{r.plan?.name ?? "—"}</div>
          <div className="text-xs text-muted-foreground">
            {r.plan ? `${brl(Number(r.amount ?? r.plan.price))} · ${planPeriodLabel(r.plan.billing_period)}` : "—"}
          </div>
        </div>
      ),
    },
    {
      key: "vig", header: "Vigência", className: "w-44",
      cell: (r) => (
        <div className="text-xs text-muted-foreground">
          <div>Ativada: {fmt(r.activated_at)}</div>
          <div>Vence: <span className="font-semibold text-foreground">{fmt(r.expires_at)}</span></div>
        </div>
      ),
    },
    {
      key: "status", header: "Situação", className: "w-52",
      cell: (r) => {
        const d = daysUntil(r.expires_at);
        return (
          <div className="space-y-1">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${DERIVED_CLASS[r.derived]}`}>
              {DERIVED_LABEL[r.derived]}
            </span>
            <div className="text-[11px] text-muted-foreground">{daysLabel(r.expires_at)}</div>
            {d !== null && d >= 0 && d <= 30 && (
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-orange" style={{ width: `${Math.max(4, (d / 30) * 100)}%` }} />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions", header: "", className: "w-40 text-right",
      cell: (r) => {
        const url = buildWhatsAppUrl(
          r.professional?.whatsapp ?? r.contact_phone,
          whatsappTemplate({
            contactName: (r.contact_name ?? "").split(" ")[0] || "tudo bem",
            companyName: r.professional?.business_name || r.professional?.professional_name || "",
            expiresAt: r.expires_at,
          }),
        );
        return (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {url && (
              <Button asChild size="sm" variant="ghost" className="text-[#128C4A]">
                <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => contacted.mutate(r)}>
                  <MessageCircle size={15} />
                </a>
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>Gerir</Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Gestão de assinaturas"
        description="Ativação manual, controle de vencimentos, cobrança por WhatsApp e histórico completo."
        actions={
          <>
            <SettingsDialog />
            <Button size="sm" variant="outline" onClick={() => lifecycle.mutate()} disabled={lifecycle.isPending}>
              <RefreshCw size={15} className={lifecycle.isPending ? "animate-spin" : ""} /> Rodar rotina
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<BadgeCheck size={20} />} label="Assinaturas ativas" value={metrics.active} hint={`${metrics.pending} aguardando ativação`} tone="emerald" loading={isLoading} />
        <MetricCard icon={<AlarmClock size={20} />} label="Vencendo em 30 dias" value={metrics.due30 + metrics.due15 + metrics.due7 + metrics.dueToday} hint={`${metrics.due7 + metrics.dueToday} críticas (≤7 dias)`} tone="orange" loading={isLoading} />
        <MetricCard icon={<AlertTriangle size={20} />} label="Vencidas / suspensas" value={metrics.expired + metrics.suspended} hint={`${metrics.notNotified} sem cobrança registrada`} tone="violet" loading={isLoading} />
        <MetricCard icon={<Wallet size={20} />} label="Receita mensal (MRR)" value={brl(metrics.mrr)} hint={`ARR estimado ${brl(metrics.arr)}`} tone="primary" loading={isLoading} />
      </div>

      {metrics.activeWithoutPlan > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Users size={16} />
          <span>
            <strong>{metrics.activeWithoutPlan}</strong> empresas publicadas ainda não possuem assinatura vinculada.
          </span>
        </div>
      )}

      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por empresa, região, plano ou e-mail…"
        filters={FILTERS}
        activeFilter={filter}
        onFilterChange={setFilter}
        right={
          <div className="flex flex-wrap gap-2">
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Plano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                {(plans ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Região" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">Todas as regiões</SelectItem>
                {DF_REGIONS.map((r) => <SelectItem key={r.slug} value={r.name}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <AdminTable
        columns={columns}
        rows={filtered}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        onRowClick={(r) => setSelected(r)}
        emptyText="Nenhuma assinatura encontrada com esses filtros."
      />

      <SubscriptionDetailDrawer
        row={selected ? filtered.find((r) => r.id === selected.id) ?? selected : null}
        plans={plans ?? []}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

function SettingsDialog() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["sub-settings"], queryFn: getSubscriptionSettings });
  const [offsets, setOffsets] = useState<string>("");
  const [grace, setGrace] = useState<string>("");

  const save = useMutation({
    mutationFn: (patch: Record<string, unknown>) => updateSubscriptionSettings(data!.id, patch),
    onSuccess: () => { toast.success("Configurações salvas"); qc.invalidateQueries({ queryKey: ["sub-settings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Settings2 size={15} /> Alertas</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Configurações de assinatura</DialogTitle></DialogHeader>
        {!data ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Alertas antes do vencimento (dias, separados por vírgula)</Label>
              <Input
                defaultValue={data.alert_offsets.join(", ")}
                onChange={(e) => setOffsets(e.target.value)}
                placeholder="30, 15, 7, 3, 1"
              />
            </div>
            <div>
              <Label className="text-xs">Dias de tolerância após o vencimento</Label>
              <Input type="number" defaultValue={data.grace_days} onChange={(e) => setGrace(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={data.notify_clients} onCheckedChange={(v) => save.mutate({ notify_clients: v })} id="nc" />
              <Label htmlFor="nc" className="text-xs">Notificar clientes no painel</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={data.notify_admins} onCheckedChange={(v) => save.mutate({ notify_admins: v })} id="na" />
              <Label htmlFor="na" className="text-xs">Notificar administradores</Label>
            </div>
            <div>
              <Label className="text-xs">Ao vencer</Label>
              <Select defaultValue={data.expiry_behavior} onValueChange={(v) => save.mutate({ expiry_behavior: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">Manter perfil publicado</SelectItem>
                  <SelectItem value="unpublish">Ocultar perfil do site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              onClick={() => save.mutate({
                ...(offsets ? { alert_offsets: offsets.split(",").map((n) => Number(n.trim())).filter((n) => Number.isFinite(n) && n > 0) } : {}),
                ...(grace ? { grace_days: Number(grace) } : {}),
              })}
            >
              Salvar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
