import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Award, CheckCircle2, Gift, Heart, Plus, Search, Sparkles, Star, Trash2, Users, Wrench,
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
import { Switch } from "@/components/ui/switch";
import {
  listBenefits, upsertBenefit, deleteBenefit, type BenefitRow,
} from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/beneficios")({
  head: () => ({ meta: [{ title: "Benefícios · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: BeneficiosPage,
});

const AUDIENCE_LABEL: Record<BenefitRow["audience"], string> = {
  client: "Clientes", pro: "Profissionais", both: "Todos",
};
const AUDIENCE_ICON: Record<BenefitRow["audience"], typeof Users> = {
  client: Heart, pro: Wrench, both: Users,
};

const ICONS_LIST = ["sparkles", "gift", "star", "award", "heart", "check"];
const ICON_MAP: Record<string, typeof Sparkles> = { sparkles: Sparkles, gift: Gift, star: Star, award: Award, heart: Heart, check: CheckCircle2 };

function BeneficiosPage() {
  const qc = useQueryClient();
  const [audience, setAudience] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<BenefitRow> | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-benefits", audience, search],
    queryFn: () => listBenefits({ audience: audience || undefined, search: search || undefined }),
  });

  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter((b) => b.is_active).length,
    forClients: data.filter((b) => b.audience === "client" || b.audience === "both").length,
    forPros: data.filter((b) => b.audience === "pro" || b.audience === "both").length,
  }), [data]);

  const save = useMutation({
    mutationFn: (v: Partial<BenefitRow> & { title: string }) => upsertBenefit(v),
    onSuccess: () => { toast.success("Benefício salvo"); qc.invalidateQueries({ queryKey: ["admin-benefits"] }); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteBenefit(id),
    onSuccess: () => { toast.success("Benefício removido"); qc.invalidateQueries({ queryKey: ["admin-benefits"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-5 shadow-float sm:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_30%,color-mix(in_oklab,var(--orange)_14%,transparent),transparent_45%),radial-gradient(circle_at_55%_70%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_35%)] lg:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange/15 bg-orange/5 px-3 py-1 text-xs font-bold text-orange">
              <Gift size={14} /> Vitrine de benefícios
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">Benefícios</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Configure benefícios exibidos nas landing pages para clientes e profissionais. Reorganize por prioridade e ative por público.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={<Gift size={18} />} label="Total" value={stats.total} />
              <Metric icon={<CheckCircle2 size={18} />} label="Ativos" value={stats.active} />
              <Metric icon={<Heart size={18} />} label="Para clientes" value={stats.forClients} />
              <Metric icon={<Wrench size={18} />} label="Para pros" value={stats.forPros} />
            </div>
          </div>
          <Button size="lg" className="rounded-full" onClick={() => setEditing({ title: "", audience: "both", icon: "sparkles", is_active: true, priority: 0 })}>
            <Plus size={16} className="mr-1" /> Novo benefício
          </Button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {[{ v: "", l: "Todos", i: Users }, { v: "client", l: "Clientes", i: Heart }, { v: "pro", l: "Profissionais", i: Wrench }, { v: "both", l: "Ambos", i: Users }].map((f) => {
              const active = audience === f.v;
              const Icon = f.i;
              return (
                <button key={f.v || "all"} type="button" onClick={() => setAudience(f.v)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground shadow-card" : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"}`}>
                  <Icon size={14} /> {f.l}
                </button>
              );
            })}
          </div>
          <div className="relative min-w-0 sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título…" className="h-11 rounded-full border-border/80 bg-background pl-9 shadow-none" />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-6">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Nenhum benefício ainda. Crie um para exibi-lo nas páginas públicas.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((b) => {
              const Icon = ICON_MAP[b.icon ?? "sparkles"] ?? Sparkles;
              const AudIcon = AUDIENCE_ICON[b.audience];
              return (
                <li key={b.id} className="group flex flex-col rounded-2xl border border-border/60 bg-background p-5 transition hover:border-primary/30 hover:shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon size={20} /></div>
                    <div className="flex items-center gap-2">
                      <StatusPill tone={b.is_active ? "success" : "neutral"}>{b.is_active ? "Ativo" : "Inativo"}</StatusPill>
                    </div>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-extrabold text-foreground">{b.title}</h3>
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{b.description || "Sem descrição."}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 font-semibold"><AudIcon size={11} /> {AUDIENCE_LABEL[b.audience]}</span>
                    {b.category && <span className="rounded-full border px-2 py-1">{b.category}</span>}
                    <span className="ml-auto">prioridade {b.priority}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 rounded-full" onClick={() => setEditing(b)}>Editar</Button>
                    <Button variant="ghost" size="sm" className="rounded-full text-destructive hover:text-destructive" onClick={() => { if (confirm(`Remover "${b.title}"?`)) del.mutate(b.id); }}><Trash2 size={14} /></Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <BenefitDialog value={editing} onClose={() => setEditing(null)} onSave={(v) => save.mutate(v)} saving={save.isPending} />
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

function BenefitDialog({ value, onClose, onSave, saving }: {
  value: Partial<BenefitRow> | null; onClose: () => void;
  onSave: (v: Partial<BenefitRow> & { title: string }) => void; saving: boolean;
}) {
  const [form, setForm] = useState<Partial<BenefitRow>>({});
  useEffect(() => { if (value) setForm(value); }, [value]);
  if (!value) return null;

  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{form.id ? "Editar benefício" : "Novo benefício"}</DialogTitle>
          <DialogDescription>Aparece nas seções de "por que escolher a ${BRAND_PLACEHOLDER}" das landing pages.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label>Título</Label>
            <Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Profissionais verificados" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="O que este benefício entrega ao usuário…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Público</Label>
              <Select value={form.audience ?? "both"} onValueChange={(v) => setForm({ ...form, audience: v as BenefitRow["audience"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Todos</SelectItem>
                  <SelectItem value="client">Clientes</SelectItem>
                  <SelectItem value="pro">Profissionais</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex.: qualidade" />
            </div>
            <div>
              <Label>Ícone</Label>
              <Select value={form.icon ?? "sparkles"} onValueChange={(v) => setForm({ ...form, icon: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ICONS_LIST.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Input type="number" value={form.priority ?? 0} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Link (opcional)</Label>
              <Input value={form.link_url ?? ""} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://…" />
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <Label className="m-0">Ativo</Label>
              <Switch checked={!!form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancelar</Button>
          <Button className="rounded-full" disabled={saving || !form.title} onClick={() => onSave(form as Parameters<typeof onSave>[0])}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
