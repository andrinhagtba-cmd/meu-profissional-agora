import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/admin/AdminTable";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  listProServices, listServiceCatalog, createProService, updateProService,
  deleteProService, type AdminProServiceRow, type ProPriceType,
} from "@/services/adminService";

const PRICE_LABEL: Record<ProPriceType, string> = {
  fixed: "Fixo",
  hourly: "Por hora",
  daily: "Por dia",
  per_visit: "Por visita",
  to_quote: "Sob orçamento",
};

export function AdminProServicesPanel({ professionalId }: { professionalId: string }) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProServiceRow | null>(null);
  const [deleting, setDeleting] = useState<AdminProServiceRow | null>(null);

  const q = useQuery({
    queryKey: ["admin-pro-services", professionalId],
    queryFn: () => listProServices(professionalId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-pro-services", professionalId] });
    qc.invalidateQueries({ queryKey: ["admin-pro-detail", professionalId] });
  };

  const toggle = useMutation({
    mutationFn: (row: AdminProServiceRow) => updateProService(row.id, { active: !row.active }),
    onSuccess: () => { toast.success("Situação atualizada"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProService(id),
    onSuccess: () => { toast.success("Serviço removido"); invalidate(); setDeleting(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 pb-3 sm:flex sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="text-base">Serviços oferecidos</CardTitle>
          <p className="text-xs text-muted-foreground">Serviços associados a este profissional, com preços e disponibilidade.</p>
        </div>
        <Button size="sm" className="shrink-0" onClick={() => setAddOpen(true)}>
          <Plus size={14} className="sm:mr-1.5" />
          <span className="hidden sm:inline">Adicionar serviço</span>
          <span className="sr-only sm:hidden">Adicionar serviço</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {q.isLoading && <><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></>}
        {!q.isLoading && (q.data?.length ?? 0) === 0 && (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhum serviço cadastrado.
          </div>
        )}
        {q.data?.map((row) => (
          <div key={row.id} className="rounded-xl border bg-card p-3 sm:flex sm:items-center sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 truncate font-medium">{row.service?.name ?? "—"}</span>
                {row.service?.category && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {row.service.category.name}
                  </span>
                )}
                <StatusPill tone={row.active ? "success" : "neutral"}>{row.active ? "Ativo" : "Inativo"}</StatusPill>
              </div>
              {row.description && (
                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{row.description}</div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3 sm:mt-0 sm:border-0 sm:pt-0">
              <div className="min-w-0 sm:text-right">
                <div className="text-[11px] text-muted-foreground">{PRICE_LABEL[row.price_type]}</div>
                <div className="text-sm font-semibold">
                  {row.starting_price != null ? `R$ ${Number(row.starting_price).toFixed(2)}` : "—"}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Switch checked={row.active} onCheckedChange={() => toggle.mutate(row)} />
                <Button variant="ghost" size="icon" onClick={() => setEditing(row)}><Pencil size={14} /></Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleting(row)}><Trash2 size={14} className="text-destructive" /></Button>
              </div>
            </div>
          </div>
        ))}

      </CardContent>

      {addOpen && (
        <AddServiceDialog
          professionalId={professionalId}
          existingIds={new Set((q.data ?? []).map((r) => r.service_id))}
          onClose={() => setAddOpen(false)}
          onSaved={() => { invalidate(); setAddOpen(false); }}
        />
      )}
      {editing && (
        <EditServiceDialog
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { invalidate(); setEditing(null); }}
        />
      )}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá "{deleting?.service?.name}" da vitrine do profissional.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && remove.mutate(deleting.id)}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function normalize(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function AddServiceDialog({
  professionalId, existingIds, onClose, onSaved,
}: {
  professionalId: string;
  existingIds: Set<string>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const catalog = useQuery({ queryKey: ["service-catalog"], queryFn: listServiceCatalog });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [priceType, setPriceType] = useState<ProPriceType>("to_quote");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const options = useMemo(
    () => (catalog.data ?? []).filter((s) => !existingIds.has(s.id)),
    [catalog.data, existingIds],
  );

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    options.forEach((s) => { if (s.category) map.set(s.category.id, s.category.name); });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [options]);

  const groups = useMemo(() => {
    const term = normalize(search.trim());
    const filtered = options.filter((s) => {
      if (categoryFilter !== "all" && s.category?.id !== categoryFilter) return false;
      if (!term) return true;
      return normalize(`${s.name} ${s.category?.name ?? ""}`).includes(term);
    });
    const map = new Map<string, { id: string; name: string; items: typeof filtered }>();
    filtered.forEach((s) => {
      const id = s.category?.id ?? "none";
      const name = s.category?.name ?? "Sem categoria";
      if (!map.has(id)) map.set(id, { id, name, items: [] });
      map.get(id)!.items.push(s);
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [options, search, categoryFilter]);

  const visibleIds = useMemo(() => groups.flatMap((g) => g.items.map((i) => i.id)), [groups]);

  const toggleId = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleGroup = (ids: string[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const create = useMutation({
    mutationFn: async () => {
      const ids = [...selected];
      if (ids.length === 0) throw new Error("Selecione ao menos um serviço.");
      const numericPrice = price.trim() === "" ? null : Number(price.replace(",", "."));
      if (numericPrice !== null && !Number.isFinite(numericPrice)) throw new Error("Preço inválido.");
      for (const id of ids) {
        await createProService(professionalId, id, {
          description: description.trim() || null,
          starting_price: priceType === "to_quote" ? null : numericPrice,
          price_type: priceType,
          active,
        });
      }
      return ids.length;
    },
    onSuccess: (n) => { toast.success(n === 1 ? "Serviço adicionado" : `${n} serviços adicionados`); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-3xl sm:rounded-2xl">
        <DialogHeader className="shrink-0 border-b bg-muted/40 px-4 py-3 text-left sm:px-6 sm:py-4">
          <DialogTitle className="text-base sm:text-lg">Adicionar serviços</DialogTitle>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Busque no catálogo, marque quantas subcategorias quiser e defina o preço padrão para todas.
          </p>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto overscroll-contain md:h-[62vh] md:min-h-[420px] md:grid-cols-[1.15fr_1fr] md:overflow-hidden">
          {/* Catálogo */}
          <div className="flex min-h-0 flex-col border-b md:h-full md:overflow-hidden md:border-b-0 md:border-r">


            <div className="sticky top-0 z-30 space-y-2 border-b bg-background px-4 pb-3 pt-3 shadow-sm sm:px-5 sm:pt-4 md:static md:z-auto md:border-b-0 md:shadow-none">

              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar serviço ou categoria…"
                  className="h-11 rounded-xl pl-9"
                />
              </div>
              <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                    categoryFilter === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  Todas
                </button>
                {categories.map(([id, name]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCategoryFilter(id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                      categoryFilter === id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overscroll-contain px-4 pb-6 sm:px-5 md:overflow-y-auto md:pb-10 md:[scrollbar-gutter:stable]">

              {catalog.isLoading && <><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-full" /></>}
              {!catalog.isLoading && groups.length === 0 && (
                <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground">
                  Nenhum serviço encontrado.
                </div>
              )}
              {groups.map((g) => {
                const ids = g.items.map((i) => i.id);
                const allChecked = ids.every((id) => selected.has(id));
                return (
                  <div key={g.id} className="pt-1">
                    <div className="z-10 -mx-1 mb-1.5 flex items-center justify-between gap-2 bg-background/95 px-1 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:sticky md:top-0">
                      <span className="truncate text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        {g.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleGroup(ids, !allChecked)}
                        className="shrink-0 text-[11px] font-semibold text-primary hover:underline"
                      >
                        {allChecked ? "Limpar" : "Marcar todos"}
                      </button>
                    </div>

                    <div className="space-y-1">
                      {g.items.map((s) => {
                        const checked = selected.has(s.id);
                        return (
                          <label
                            key={s.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                              checked ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/60"
                            }`}
                          >
                            <Checkbox checked={checked} onCheckedChange={() => toggleId(s.id)} />
                            <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configuração */}
          <div className="min-h-0 space-y-4 overscroll-contain px-4 py-4 sm:px-5 md:h-full md:overflow-y-auto md:pb-8">
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Selecionados</span>
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">
                  {selected.size}
                </span>
              </div>
              {selected.size > 0 ? (
                <div className="mt-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto sm:max-h-40">
                  {[...selected].map((id) => {
                    const s = options.find((o) => o.id === id);
                    if (!s) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleId(id)}
                        className="inline-flex max-w-full items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[11px] font-medium shadow-sm hover:bg-destructive/10"
                      >
                        <span className="truncate">{s.name}</span>
                        <X size={11} className="shrink-0" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Marque os serviços no catálogo para adicioná-los de uma só vez.
                </p>
              )}
              {selected.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="mt-2 text-[11px] font-semibold text-muted-foreground hover:text-destructive"
                >
                  Limpar seleção
                </button>
              )}
            </div>

            <PricingFields
              priceType={priceType} setPriceType={setPriceType}
              price={price} setPrice={setPrice}
            />
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Descrição (opcional)</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Aplicada a todos os serviços selecionados."
              />
            </div>
            <label className="flex items-center justify-between rounded-xl border bg-background px-3 py-2.5">
              <span className="text-xs font-medium">Ativo na vitrine</span>
              <Switch checked={active} onCheckedChange={setActive} />
            </label>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-col-reverse gap-2 border-t bg-muted/40 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="hidden text-xs text-muted-foreground sm:block">
            {visibleIds.length} serviço(s) disponíveis no catálogo
          </span>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none">Cancelar</Button>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || selected.size === 0}
              className="flex-1 sm:flex-none"
            >
              <Save size={14} className="mr-1.5" />
              {create.isPending ? "Adicionando…" : `Adicionar${selected.size ? ` (${selected.size})` : ""}`}
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}


function EditServiceDialog({
  row, onClose, onSaved,
}: { row: AdminProServiceRow; onClose: () => void; onSaved: () => void }) {
  const [priceType, setPriceType] = useState<ProPriceType>(row.price_type);
  const [price, setPrice] = useState(row.starting_price != null ? String(row.starting_price) : "");
  const [description, setDescription] = useState(row.description ?? "");
  const [active, setActive] = useState(row.active);

  const save = useMutation({
    mutationFn: async () => {
      const numericPrice = price.trim() === "" ? null : Number(price);
      if (numericPrice !== null && !Number.isFinite(numericPrice)) throw new Error("Preço inválido.");
      await updateProService(row.id, {
        description: description.trim() || null,
        starting_price: numericPrice,
        price_type: priceType,
        active,
      });
    },
    onSuccess: () => { toast.success("Serviço atualizado"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Editar “{row.service?.name}”</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <PricingFields
            priceType={priceType} setPriceType={setPriceType}
            price={price} setPrice={setPrice}
          />
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Descrição</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <label className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
            <span className="text-xs font-medium">Ativo na vitrine</span>
            <Switch checked={active} onCheckedChange={setActive} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}><X size={14} className="mr-1.5" />Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save size={14} className="mr-1.5" /> Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PricingFields({
  priceType, setPriceType, price, setPrice,
}: {
  priceType: ProPriceType; setPriceType: (v: ProPriceType) => void;
  price: string; setPrice: (v: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Tipo de preço</Label>
        <Select value={priceType} onValueChange={(v) => setPriceType(v as ProPriceType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(PRICE_LABEL) as ProPriceType[]).map((k) => (
              <SelectItem key={k} value={k}>{PRICE_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Preço inicial (R$)</Label>
        <Input
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={priceType === "to_quote"}
          placeholder={priceType === "to_quote" ? "—" : "0,00"}
        />
      </div>
    </div>
  );
}
