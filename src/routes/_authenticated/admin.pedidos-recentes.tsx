import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, StatusPill, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DfRegionCombobox } from "@/components/shared/DfRegionCombobox";
import {
  listShowcaseRequests, upsertShowcaseRequest, deleteShowcaseRequest,
  toggleShowcaseRequestPublish, type AdminShowcaseRequest, type UpsertShowcaseRequest,
} from "@/services/adminContentService";

export const Route = createFileRoute("/_authenticated/admin/pedidos-recentes")({
  head: () => ({ meta: [{ title: "Pedidos recentes — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const URGENCIES = [
  { value: "hoje", label: "Urgente · Hoje" },
  { value: "esta-semana", label: "Esta semana" },
  { value: "data", label: "Data marcada" },
  { value: "sem-urgencia", label: "Sem urgência" },
];

function urgencyLabel(v: string) {
  return URGENCIES.find((u) => u.value === v)?.label ?? v;
}

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminShowcaseRequest | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminShowcaseRequest | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-showcase-requests", search],
    queryFn: () => listShowcaseRequests(search),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-showcase-requests"] });
    qc.invalidateQueries({ queryKey: ["home-showcase-requests"] });
  };

  const upsertM = useMutation({
    mutationFn: upsertShowcaseRequest,
    onSuccess: () => { toast.success("Pedido salvo"); invalidate(); setCreating(false); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteM = useMutation({
    mutationFn: deleteShowcaseRequest,
    onSuccess: () => { toast.success("Removido"); invalidate(); setToDelete(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const togM = useMutation({
    mutationFn: (v: { id: string; on: boolean }) => toggleShowcaseRequestPublish(v.id, v.on),
    onSuccess: invalidate,
  });

  const columns: Column<AdminShowcaseRequest>[] = [
    {
      key: "cat", header: "Categoria", cell: (r) => (
        <div>
          <div className="font-semibold text-foreground">{r.category}</div>
          <div className="text-xs text-muted-foreground">{r.city}/{r.state}</div>
        </div>
      ),
    },
    { key: "desc", header: "Mensagem do cliente", cell: (r) => <span className="line-clamp-2 text-sm text-muted-foreground">{r.description}</span> },
    { key: "urg", header: "Urgência", cell: (r) => <StatusPill tone={r.urgency === "hoje" ? "warning" : "info"}>{urgencyLabel(r.urgency)}</StatusPill>, className: "w-40" },
    { key: "props", header: "Propostas", cell: (r) => <span className="font-semibold text-primary">{r.proposals_count}</span>, className: "w-24 text-center" },
    { key: "date", header: "Data", cell: (r) => <span className="text-xs text-muted-foreground">{new Date(`${r.request_date}T12:00:00`).toLocaleDateString("pt-BR")}</span>, className: "w-28" },
    {
      key: "pub", header: "Publicado", cell: (r) => (
        <Switch checked={r.is_published} onCheckedChange={(v) => togM.mutate({ id: r.id, on: v })} />
      ), className: "w-24",
    },
    {
      key: "actions", header: "", cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditing(r)}><Pencil size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setToDelete(r)}><Trash2 size={14} className="text-destructive" /></Button>
        </div>
      ), className: "w-28 text-right",
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Pedidos recentes"
        description="Mensagens de pedidos exibidas na seção “Pedidos recentes” da home."
        actions={<Button onClick={() => setCreating(true)}><Plus size={16} className="mr-1" />Novo</Button>}
      />
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Buscar categoria, região ou mensagem…" />
      <AdminTable columns={columns} rows={data} isLoading={isLoading} rowKey={(r) => r.id} emptyText="Nenhum pedido cadastrado." />

      <RequestDialog
        open={creating || !!editing}
        initial={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={(i) => upsertM.mutate(i)}
        submitting={upsertM.isPending}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
            <AlertDialogDescription>O pedido de “{toDelete?.category}” será removido da home.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && deleteM.mutate(toDelete.id)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RequestDialog({ open, initial, onClose, onSubmit, submitting }: {
  open: boolean; initial: AdminShowcaseRequest | null; onClose: () => void;
  onSubmit: (i: UpsertShowcaseRequest) => void; submitting: boolean;
}) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Plano Piloto");
  const [date, setDate] = useState("");
  const [urgency, setUrgency] = useState("esta-semana");
  const [proposals, setProposals] = useState(0);
  const [order, setOrder] = useState(0);
  const [published, setPublished] = useState(true);

  useEffect(() => {
    if (open) {
      setCategory(initial?.category ?? "");
      setDescription(initial?.description ?? "");
      setCity(initial?.city ?? "Plano Piloto");
      setDate(initial?.request_date ?? new Date().toISOString().slice(0, 10));
      setUrgency(initial?.urgency ?? "esta-semana");
      setProposals(initial?.proposals_count ?? 0);
      setOrder(initial?.display_order ?? 0);
      setPublished(initial?.is_published ?? true);
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Editar pedido" : "Novo pedido"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Categoria / serviço</Label><Input value={category} placeholder="Eletricista" onChange={(e) => setCategory(e.target.value)} /></div>
          <div>
            <Label>Mensagem do cliente</Label>
            <Textarea value={description} rows={4} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Região Administrativa</Label>
            <DfRegionCombobox value={city} onChange={setCity} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Urgência</Label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {URGENCIES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <div><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Propostas</Label><Input type="number" min={0} value={proposals} onChange={(e) => setProposals(Number(e.target.value))} /></div>
            <div><Label>Ordem</Label><Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} /></div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={published} onCheckedChange={setPublished} /><Label>Publicado</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={submitting || !category || !description}
            onClick={() => onSubmit({
              id: initial?.id, category, description, city, state: "DF",
              request_date: date, urgency, proposals_count: proposals,
              display_order: order, is_published: published,
            })}
          >Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
