import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";

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
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <div>
          <CardTitle className="text-base">Serviços oferecidos</CardTitle>
          <p className="text-xs text-muted-foreground">Serviços associados a este profissional, com preços e disponibilidade.</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} className="mr-1.5" /> Adicionar serviço
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
          <div key={row.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-medium">{row.service?.name ?? "—"}</span>
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
            <div className="text-right">
              <div className="text-xs text-muted-foreground">{PRICE_LABEL[row.price_type]}</div>
              <div className="font-semibold">
                {row.starting_price != null ? `R$ ${Number(row.starting_price).toFixed(2)}` : "—"}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Switch checked={row.active} onCheckedChange={() => toggle.mutate(row)} />
              <Button variant="ghost" size="icon" onClick={() => setEditing(row)}><Pencil size={14} /></Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleting(row)}><Trash2 size={14} className="text-destructive" /></Button>
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

function AddServiceDialog({
  professionalId, existingIds, onClose, onSaved,
}: {
  professionalId: string;
  existingIds: Set<string>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const catalog = useQuery({ queryKey: ["service-catalog"], queryFn: listServiceCatalog });
  const [serviceId, setServiceId] = useState<string>("");
  const [priceType, setPriceType] = useState<ProPriceType>("to_quote");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const options = useMemo(
    () => (catalog.data ?? []).filter((s) => !existingIds.has(s.id)),
    [catalog.data, existingIds],
  );

  const create = useMutation({
    mutationFn: async () => {
      if (!serviceId) throw new Error("Selecione um serviço.");
      const numericPrice = price.trim() === "" ? null : Number(price);
      if (numericPrice !== null && !Number.isFinite(numericPrice)) throw new Error("Preço inválido.");
      await createProService(professionalId, serviceId, {
        description: description.trim() || null,
        starting_price: numericPrice,
        price_type: priceType,
        active,
      });
    },
    onSuccess: () => { toast.success("Serviço adicionado"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Adicionar serviço</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Serviço do catálogo</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger><SelectValue placeholder={catalog.isLoading ? "Carregando…" : "Selecione"} /></SelectTrigger>
              <SelectContent className="max-h-72">
                {options.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{s.category ? ` — ${s.category.name}` : ""}
                  </SelectItem>
                ))}
                {options.length === 0 && !catalog.isLoading && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Todos os serviços já foram adicionados.</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <PricingFields
            priceType={priceType} setPriceType={setPriceType}
            price={price} setPrice={setPrice}
          />
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Descrição (opcional)</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <label className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
            <span className="text-xs font-medium">Ativo na vitrine</span>
            <Switch checked={active} onCheckedChange={setActive} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending || !serviceId}>
            <Save size={14} className="mr-1.5" /> Adicionar
          </Button>
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
