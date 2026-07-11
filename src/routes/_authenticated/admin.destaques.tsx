import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2, CheckCircle2, Home, MapPin, Plus, Search, Sparkles, Star, Tag, Trash2,
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
import { Switch } from "@/components/ui/switch";
import {
  listHighlights, upsertHighlight, deleteHighlight, searchProfessionalsForHighlight,
  type HighlightRow,
} from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/destaques")({
  head: () => ({ meta: [{ title: "Destaques · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: DestaquesPage,
});

const SECTION_LABEL: Record<HighlightRow["section"], string> = {
  home: "Home", category: "Categoria", city: "Cidade", banner: "Banner",
};
const SECTION_ICON: Record<HighlightRow["section"], typeof Home> = {
  home: Home, category: Tag, city: MapPin, banner: Sparkles,
};

function DestaquesPage() {
  const qc = useQueryClient();
  const [section, setSection] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<HighlightRow> | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-highlights", section, search],
    queryFn: () => listHighlights({ section: section || undefined, search: search || undefined }),
  });

  const stats = useMemo(() => {
    const now = Date.now();
    const active = data.filter((h) => h.is_active && (!h.ends_at || new Date(h.ends_at).getTime() > now)).length;
    const bySection = (s: string) => data.filter((h) => h.section === s).length;
    return { total: data.length, active, home: bySection("home"), category: bySection("category") };
  }, [data]);

  const save = useMutation({
    mutationFn: (v: Partial<HighlightRow> & { section: string }) => upsertHighlight(v),
    onSuccess: () => { toast.success("Destaque salvo"); qc.invalidateQueries({ queryKey: ["admin-highlights"] }); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteHighlight(id),
    onSuccess: () => { toast.success("Destaque removido"); qc.invalidateQueries({ queryKey: ["admin-highlights"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-5 shadow-float sm:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_30%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_45%),radial-gradient(circle_at_55%_70%,color-mix(in_oklab,var(--orange)_14%,transparent),transparent_35%)] lg:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              <Star size={14} /> Curadoria editorial
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">Destaques</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Escolha profissionais em evidência na home, categorias, cidades e banners promocionais. Controle prazo, ordem e ativação.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={<Star size={18} />} label="Total" value={stats.total} />
              <Metric icon={<CheckCircle2 size={18} />} label="Ativos agora" value={stats.active} />
              <Metric icon={<Home size={18} />} label="Home" value={stats.home} />
              <Metric icon={<Tag size={18} />} label="Categorias" value={stats.category} />
            </div>
          </div>
          <Button size="lg" className="rounded-full" onClick={() => setEditing({ section: "home", position: 0, is_active: true, starts_at: new Date().toISOString() })}>
            <Plus size={16} className="mr-1" /> Novo destaque
          </Button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {[{ v: "", l: "Todos", i: Star }, ...(Object.keys(SECTION_LABEL) as HighlightRow["section"][]).map((s) => ({ v: s, l: SECTION_LABEL[s], i: SECTION_ICON[s] }))].map((f) => {
              const active = section === f.v;
              const Icon = f.i;
              return (
                <button key={f.v || "all"} type="button" onClick={() => setSection(f.v)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground shadow-card" : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"}`}>
                  <Icon size={14} /> {f.l}
                </button>
              );
            })}
          </div>
          <div className="relative min-w-0 sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por profissional…" className="h-11 rounded-full border-border/80 bg-background pl-9 shadow-none" />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-6">
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Nenhum destaque configurado. Selecione um profissional para exibi-lo em evidência.
          </div>
        ) : (
          <ul className="space-y-2">
            {data.map((h) => {
              const Icon = SECTION_ICON[h.section];
              const name = h.professional?.professional_name ?? h.professional?.business_name ?? "Profissional";
              const now = Date.now();
              const expired = h.ends_at && new Date(h.ends_at).getTime() < now;
              return (
                <li key={h.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-4 transition hover:border-primary/30 hover:shadow-card">
                  <InitialsAvatar name={name} className="h-11 w-11" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-display text-sm font-extrabold text-foreground">{name}</h3>
                      <StatusPill tone="info"><Icon size={11} className="mr-1 inline" />{SECTION_LABEL[h.section]}</StatusPill>
                      {h.reference && <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{h.reference}</span>}
                      <StatusPill tone={expired ? "neutral" : h.is_active ? "success" : "warning"}>
                        {expired ? "Expirado" : h.is_active ? "Ativo" : "Inativo"}
                      </StatusPill>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>posição {h.position}</span>
                      <span>{new Date(h.starts_at).toLocaleDateString("pt-BR")} → {h.ends_at ? new Date(h.ends_at).toLocaleDateString("pt-BR") : "sem prazo"}</span>
                      {(h.professional?.city || h.professional?.state) && <span>{[h.professional?.city, h.professional?.state].filter(Boolean).join(" / ")}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => setEditing(h)}>Editar</Button>
                    <Button variant="ghost" size="sm" className="rounded-full text-destructive hover:text-destructive" onClick={() => { if (confirm("Remover destaque?")) del.mutate(h.id); }}><Trash2 size={14} /></Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <HighlightDialog value={editing} onClose={() => setEditing(null)} onSave={(v) => save.mutate(v)} saving={save.isPending} />
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

function HighlightDialog({ value, onClose, onSave, saving }: {
  value: Partial<HighlightRow> | null; onClose: () => void;
  onSave: (v: Partial<HighlightRow> & { section: string }) => void; saving: boolean;
}) {
  const [form, setForm] = useState<Partial<HighlightRow>>({});
  const [proQuery, setProQuery] = useState("");
  useEffect(() => { if (value) { setForm(value); setProQuery(""); } }, [value]);

  const { data: proResults = [] } = useQuery({
    queryKey: ["highlight-pro-search", proQuery],
    queryFn: () => searchProfessionalsForHighlight(proQuery),
    enabled: proQuery.length >= 2,
  });

  if (!value) return null;
  const selectedName = form.professional?.professional_name ?? form.professional?.business_name;

  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{form.id ? "Editar destaque" : "Novo destaque"}</DialogTitle>
          <DialogDescription>Vincule um profissional a uma seção com posição, prazo e observações.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label>Profissional</Label>
            {form.professional_id ? (
              <div className="flex items-center gap-2 rounded-xl border p-3">
                <Building2 size={16} className="text-primary" />
                <span className="flex-1 truncate text-sm font-semibold">{selectedName || form.professional_id}</span>
                <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setForm({ ...form, professional_id: null, professional: null })}>Trocar</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input value={proQuery} onChange={(e) => setProQuery(e.target.value)} placeholder="Buscar profissional por nome…" />
                {proResults.length > 0 && (
                  <ul className="max-h-48 space-y-1 overflow-auto rounded-xl border p-2">
                    {proResults.map((p) => (
                      <li key={p.id}>
                        <button type="button" onClick={() => setForm({ ...form, professional_id: p.id, professional: { id: p.id, professional_name: p.name, business_name: null, city: p.city, state: p.state } })}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-primary/5">
                          <InitialsAvatar name={p.name} className="h-8 w-8" />
                          <div className="min-w-0">
                            <div className="truncate font-semibold">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{[p.city, p.state].filter(Boolean).join(" / ")}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Seção</Label>
              <Select value={form.section ?? "home"} onValueChange={(v) => setForm({ ...form, section: v as HighlightRow["section"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(SECTION_LABEL) as HighlightRow["section"][]).map((s) => <SelectItem key={s} value={s}>{SECTION_LABEL[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Referência</Label>
              <Input value={form.reference ?? ""} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="slug categoria/cidade" />
            </div>
            <div>
              <Label>Posição</Label>
              <Input type="number" min={0} value={form.position ?? 0} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <Label className="m-0">Ativo</Label>
              <Switch checked={!!form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
            </div>
            <div>
              <Label>Início</Label>
              <Input type="datetime-local" value={form.starts_at ? new Date(form.starts_at).toISOString().slice(0, 16) : ""} onChange={(e) => setForm({ ...form, starts_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
            </div>
            <div>
              <Label>Fim</Label>
              <Input type="datetime-local" value={form.ends_at ? new Date(form.ends_at).toISOString().slice(0, 16) : ""} onChange={(e) => setForm({ ...form, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Motivo da curadoria…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancelar</Button>
          <Button className="rounded-full" disabled={saving || !form.section || !form.professional_id} onClick={() => onSave(form as Parameters<typeof onSave>[0])}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
