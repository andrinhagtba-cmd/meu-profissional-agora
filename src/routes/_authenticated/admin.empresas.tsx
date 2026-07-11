import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2, CheckCircle2, DollarSign, Handshake, Mail, Phone, Plus, Search, Trash2, TrendingUp, Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill, InitialsAvatar } from "@/components/admin/AdminTable";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  listB2BCompanies, upsertB2BCompany, deleteB2BCompany, type B2BCompanyRow,
} from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/empresas")({
  head: () => ({ meta: [{ title: "Empresas B2B · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: EmpresasPage,
});

const STATUS_LABEL: Record<B2BCompanyRow["status"], string> = {
  prospect: "Prospect", negotiating: "Negociando", active: "Ativo", paused: "Pausado", lost: "Perdido",
};
const STATUS_TONE: Record<B2BCompanyRow["status"], "info" | "warning" | "success" | "neutral" | "danger"> = {
  prospect: "info", negotiating: "warning", active: "success", paused: "neutral", lost: "danger",
};

function EmpresasPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<B2BCompanyRow> | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-b2b", status, search],
    queryFn: () => listB2BCompanies({ status: status || undefined, search: search || undefined }),
  });

  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter((c) => c.status === "active").length,
    pipeline: data.filter((c) => c.status === "prospect" || c.status === "negotiating").length,
    mrr: data.reduce((s, c) => s + (c.status === "active" ? Number(c.monthly_volume || 0) : 0), 0),
  }), [data]);

  const statusCount = (s: B2BCompanyRow["status"]) => data.filter((c) => c.status === s).length;

  const save = useMutation({
    mutationFn: (v: Partial<B2BCompanyRow> & { name: string }) => upsertB2BCompany(v),
    onSuccess: () => { toast.success("Empresa salva"); qc.invalidateQueries({ queryKey: ["admin-b2b"] }); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteB2BCompany(id),
    onSuccess: () => { toast.success("Empresa removida"); qc.invalidateQueries({ queryKey: ["admin-b2b"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-5 shadow-float sm:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_30%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_45%),radial-gradient(circle_at_55%_70%,color-mix(in_oklab,var(--orange)_14%,transparent),transparent_35%)] lg:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              <Handshake size={14} /> CRM corporativo
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">Empresas B2B</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Acompanhe contas corporativas do primeiro contato ao contrato ativo. Registre segmentos, tickets e responsáveis.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={<Building2 size={18} />} label="Empresas" value={stats.total} />
              <Metric icon={<CheckCircle2 size={18} />} label="Clientes ativos" value={stats.active} />
              <Metric icon={<TrendingUp size={18} />} label="Em pipeline" value={stats.pipeline} />
              <Metric icon={<DollarSign size={18} />} label="Volume/mês" value={stats.mrr.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })} />
            </div>
          </div>
          <Button size="lg" className="rounded-full" onClick={() => setEditing({ name: "", status: "prospect" })}>
            <Plus size={16} className="mr-1" /> Nova empresa
          </Button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterPill active={status === ""} onClick={() => setStatus("")} count={data.length}>Todos</FilterPill>
            {(Object.keys(STATUS_LABEL) as B2BCompanyRow["status"][]).map((s) => (
              <FilterPill key={s} active={status === s} onClick={() => setStatus(s)} count={statusCount(s)}>{STATUS_LABEL[s]}</FilterPill>
            ))}
          </div>
          <div className="relative min-w-0 sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar empresa/contato…" className="h-11 rounded-full border-border/80 bg-background pl-9 shadow-none" />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-6">
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Nenhuma empresa cadastrada ainda. Comece adicionando um lead B2B.
          </div>
        ) : (
          <ul className="space-y-2">
            {data.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-4 transition hover:border-primary/30 hover:shadow-card">
                <InitialsAvatar name={c.name} className="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-display text-base font-extrabold text-foreground">{c.name}</h3>
                    <StatusPill tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</StatusPill>
                    {c.segment && <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{c.segment}</span>}
                    {c.employees_count && <span className="text-xs text-muted-foreground">{c.employees_count} colab.</span>}
                    {c.plan && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{c.plan}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                    {c.contact_name && <span className="inline-flex items-center gap-1"><Users2 size={12} /> {c.contact_name}</span>}
                    {c.contact_email && <span className="inline-flex items-center gap-1"><Mail size={12} /> {c.contact_email}</span>}
                    {c.contact_phone && <span className="inline-flex items-center gap-1"><Phone size={12} /> {c.contact_phone}</span>}
                    {c.monthly_volume != null && Number(c.monthly_volume) > 0 && (
                      <span className="inline-flex items-center gap-1 font-semibold text-primary">
                        <DollarSign size={12} /> {Number(c.monthly_volume).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}/mês
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => setEditing(c)}>Editar</Button>
                  <Button variant="ghost" size="sm" className="rounded-full text-destructive hover:text-destructive" onClick={() => { if (confirm(`Remover ${c.name}?`)) del.mutate(c.id); }}><Trash2 size={14} /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <B2BDialog value={editing} onClose={() => setEditing(null)} onSave={(v) => save.mutate(v)} saving={save.isPending} />
    </div>
  );
}

function FilterPill({ active, onClick, count, children }: { active: boolean; onClick: () => void; count: number; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground shadow-card" : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"}`}>
      {children}
      <span className={`rounded-full px-1.5 py-0.5 text-xs ${active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>{count}</span>
    </button>
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

function B2BDialog({ value, onClose, onSave, saving }: {
  value: Partial<B2BCompanyRow> | null; onClose: () => void;
  onSave: (v: Partial<B2BCompanyRow> & { name: string }) => void; saving: boolean;
}) {
  const [form, setForm] = useState<Partial<B2BCompanyRow>>({});
  useEffect(() => { if (value) setForm(value); }, [value]);
  if (!value) return null;

  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{form.id ? "Editar empresa" : "Nova empresa"}</DialogTitle>
          <DialogDescription>Dados corporativos e status do funil de vendas.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Empresa</Label>
              <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Razão social ou nome fantasia" />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input value={form.cnpj ?? ""} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            </div>
            <div>
              <Label>Segmento</Label>
              <Input value={form.segment ?? ""} onChange={(e) => setForm({ ...form, segment: e.target.value })} />
            </div>
            <div>
              <Label>Colaboradores</Label>
              <Input type="number" min={0} value={form.employees_count ?? 0} onChange={(e) => setForm({ ...form, employees_count: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status ?? "prospect"} onValueChange={(v) => setForm({ ...form, status: v as B2BCompanyRow["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(STATUS_LABEL) as B2BCompanyRow["status"][]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 grid grid-cols-3 gap-3">
              <div>
                <Label>Contato</Label>
                <Input value={form.contact_name ?? ""} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={form.contact_email ?? ""} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.contact_phone ?? ""} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Cidade / UF</Label>
              <div className="flex gap-2">
                <Input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Cidade" />
                <Input className="w-16" maxLength={2} value={form.state ?? ""} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} placeholder="UF" />
              </div>
            </div>
            <div>
              <Label>Volume mensal (BRL)</Label>
              <Input type="number" min={0} step="0.01" value={form.monthly_volume ?? 0} onChange={(e) => setForm({ ...form, monthly_volume: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Plano</Label>
              <Input value={form.plan ?? ""} onChange={(e) => setForm({ ...form, plan: e.target.value })} placeholder="Ex.: Enterprise" />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://…" />
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Contexto da negociação, próximos passos…" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancelar</Button>
          <Button className="rounded-full" disabled={saving || !form.name} onClick={() => onSave(form as Parameters<typeof onSave>[0])}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
