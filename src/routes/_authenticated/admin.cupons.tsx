import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgePercent, CheckCircle2, Copy, PauseCircle, Plus, Search, Sparkles,
  Ticket, Trash2, TrendingUp, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/admin/AdminTable";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  listCoupons, upsertCoupon, deleteCoupon, type CouponRow,
} from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/cupons")({
  head: () => ({ meta: [{ title: "Cupons · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CuponsPage,
});

const STATUS_LABEL: Record<CouponRow["status"], string> = {
  active: "Ativo", paused: "Pausado", expired: "Expirado", draft: "Rascunho",
};
const STATUS_TONE: Record<CouponRow["status"], "info" | "warning" | "success" | "danger" | "neutral"> = {
  active: "success", paused: "warning", expired: "neutral", draft: "info",
};
const STATUS_FILTERS = [
  { value: "", label: "Todos", icon: Ticket },
  { value: "active", label: "Ativos", icon: CheckCircle2 },
  { value: "paused", label: "Pausados", icon: PauseCircle },
  { value: "draft", label: "Rascunho", icon: Sparkles },
  { value: "expired", label: "Expirados", icon: Wallet },
] as const;

function CuponsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<CouponRow> | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-coupons", status, search],
    queryFn: () => listCoupons({ status: status || undefined, search: search || undefined }),
  });

  const stats = useMemo(() => {
    const total = data.length;
    const active = data.filter((c) => c.status === "active").length;
    const uses = data.reduce((s, c) => s + (c.uses_count || 0), 0);
    const potential = data.reduce((s, c) => s + Number(c.discount_value) * (c.uses_count || 0), 0);
    return { total, active, uses, potential };
  }, [data]);

  const save = useMutation({
    mutationFn: (v: Partial<CouponRow> & { code: string; discount_type: "percent" | "fixed"; discount_value: number }) => upsertCoupon(v),
    onSuccess: () => {
      toast.success("Cupom salvo");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => { toast.success("Cupom removido"); qc.invalidateQueries({ queryKey: ["admin-coupons"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-5 shadow-float sm:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_30%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_45%),radial-gradient(circle_at_55%_70%,color-mix(in_oklab,var(--orange)_14%,transparent),transparent_35%)] lg:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              <BadgePercent size={14} /> Motor de descontos
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">Cupons</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Crie códigos promocionais, controle uso, validade e público-alvo. Ative campanhas por planos, categorias ou profissionais específicos.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={<Ticket size={18} />} label="Total" value={stats.total} />
              <Metric icon={<CheckCircle2 size={18} />} label="Ativos" value={stats.active} />
              <Metric icon={<TrendingUp size={18} />} label="Usos" value={stats.uses} />
              <Metric icon={<Wallet size={18} />} label="Desconto liberado" value={stats.potential.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
            </div>
          </div>
          <Button size="lg" className="rounded-full" onClick={() => setEditing({ code: "", discount_type: "percent", discount_value: 10, status: "draft", applies_to: "all", per_user_limit: 1, min_amount: 0 })}>
            <Plus size={16} className="mr-1" /> Novo cupom
          </Button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => {
              const active = status === f.value;
              const Icon = f.icon;
              return (
                <button key={f.value || "all"} type="button" onClick={() => setStatus(f.value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground shadow-card" : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"}`}>
                  <Icon size={14} /> {f.label}
                </button>
              );
            })}
          </div>
          <div className="relative min-w-0 sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código…" className="h-11 rounded-full border-border/80 bg-background pl-9 shadow-none" />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-6">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Nenhum cupom ainda. Clique em "Novo cupom" para lançar sua primeira campanha.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((c) => (
              <li key={c.id} className="group flex flex-col rounded-2xl border border-border/60 bg-background p-5 transition hover:border-primary/30 hover:shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-primary/40 bg-primary/5 px-3 py-1 font-mono text-sm font-bold text-primary">
                      {c.code}
                      <button type="button" title="Copiar" onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Código copiado"); }} className="text-primary/60 hover:text-primary"><Copy size={13} /></button>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{c.description || "Sem descrição"}</p>
                  </div>
                  <StatusPill tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</StatusPill>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold tracking-normal text-foreground">
                    {c.discount_type === "percent" ? `${c.discount_value}%` : Number(c.discount_value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">de desconto</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div><span className="block font-semibold text-foreground">{c.uses_count}{c.max_uses ? `/${c.max_uses}` : ""}</span>usos</div>
                  <div><span className="block font-semibold text-foreground">{c.applies_to}</span>público</div>
                  <div><span className="block font-semibold text-foreground">{c.valid_until ? new Date(c.valid_until).toLocaleDateString("pt-BR") : "Sem prazo"}</span>expira</div>
                  <div><span className="block font-semibold text-foreground">{c.min_amount ? Number(c.min_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}</span>mínimo</div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 rounded-full" onClick={() => setEditing(c)}>Editar</Button>
                  <Button variant="ghost" size="sm" className="rounded-full text-destructive hover:text-destructive" onClick={() => { if (confirm(`Remover cupom ${c.code}?`)) del.mutate(c.id); }}><Trash2 size={14} /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CouponDialog value={editing} onClose={() => setEditing(null)} onSave={(v) => save.mutate(v)} saving={save.isPending} />
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold tracking-normal text-foreground">{value}</div>
    </div>
  );
}

function CouponDialog({ value, onClose, onSave, saving }: {
  value: Partial<CouponRow> | null; onClose: () => void;
  onSave: (v: Partial<CouponRow> & { code: string; discount_type: "percent" | "fixed"; discount_value: number }) => void; saving: boolean;
}) {
  const [form, setForm] = useState<Partial<CouponRow>>({});
  useMemo(() => { if (value) setForm(value); }, [value]);
  if (!value) return null;

  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{form.id ? "Editar cupom" : "Novo cupom"}</DialogTitle>
          <DialogDescription>Configure código, valor, público e validade da campanha.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Código</Label>
            <Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="PROMO10" className="font-mono uppercase" />
          </div>
          <div className="sm:col-span-2">
            <Label>Descrição interna</Label>
            <Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: campanha Black Friday…" />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.discount_type ?? "percent"} onValueChange={(v) => setForm({ ...form, discount_type: v as CouponRow["discount_type"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentual (%)</SelectItem>
                <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor</Label>
            <Input type="number" min={0} step="0.01" value={form.discount_value ?? 0} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Valor mínimo (R$)</Label>
            <Input type="number" min={0} step="0.01" value={form.min_amount ?? 0} onChange={(e) => setForm({ ...form, min_amount: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Aplicável a</Label>
            <Select value={form.applies_to ?? "all"} onValueChange={(v) => setForm({ ...form, applies_to: v as CouponRow["applies_to"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="plans">Planos</SelectItem>
                <SelectItem value="categories">Categorias</SelectItem>
                <SelectItem value="professionals">Profissionais específicos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Máx. usos totais</Label>
            <Input type="number" min={0} value={form.max_uses ?? ""} onChange={(e) => setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })} placeholder="Sem limite" />
          </div>
          <div>
            <Label>Máx. usos por usuário</Label>
            <Input type="number" min={0} value={form.per_user_limit ?? 1} onChange={(e) => setForm({ ...form, per_user_limit: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Válido de</Label>
            <Input type="datetime-local" value={form.valid_from ? new Date(form.valid_from).toISOString().slice(0, 16) : ""} onChange={(e) => setForm({ ...form, valid_from: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
          </div>
          <div>
            <Label>Válido até</Label>
            <Input type="datetime-local" value={form.valid_until ? new Date(form.valid_until).toISOString().slice(0, 16) : ""} onChange={(e) => setForm({ ...form, valid_until: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status ?? "draft"} onValueChange={(v) => setForm({ ...form, status: v as CouponRow["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as CouponRow["status"][]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancelar</Button>
          <Button
            className="rounded-full"
            disabled={saving || !form.code || !form.discount_type || form.discount_value == null}
            onClick={() => onSave(form as Parameters<typeof onSave>[0])}
          >
            Salvar cupom
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
