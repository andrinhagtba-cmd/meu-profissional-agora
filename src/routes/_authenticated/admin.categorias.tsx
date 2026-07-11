import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, StatusPill, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  listCategoriesAdmin, upsertCategory, deleteCategory, toggleCategoryActive,
  type AdminCategory, type UpsertCategoryInput,
} from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  head: () => ({ meta: [{ title: "Categorias — Admin ProConecta" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories", search],
    queryFn: () => listCategoriesAdmin(search),
  });

  const upsertM = useMutation({
    mutationFn: (input: UpsertCategoryInput) => upsertCategory(input),
    onSuccess: () => {
      toast.success("Categoria salva");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setEditing(null); setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Categoria removida");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleM = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => toggleCategoryActive(v.id, v.active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<AdminCategory>[] = [
    { key: "order", header: "#", cell: (r) => <span className="text-muted-foreground">{r.display_order ?? 0}</span>, className: "w-14" },
    {
      key: "name", header: "Nome", cell: (r) => (
        <div>
          <div className="font-semibold text-foreground">{r.name}</div>
          <div className="text-xs text-muted-foreground">/{r.slug}</div>
        </div>
      ),
    },
    { key: "desc", header: "Descrição", cell: (r) => <span className="line-clamp-1 text-muted-foreground">{r.description ?? "—"}</span> },
    {
      key: "active", header: "Ativa", cell: (r) => (
        <Switch checked={r.active} onCheckedChange={(v) => toggleM.mutate({ id: r.id, active: v })} />
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
        title="Categorias"
        description="Gerencie as categorias do marketplace exibidas na home e busca."
        actions={<Button onClick={() => setCreating(true)}><Plus size={16} className="mr-1" />Nova categoria</Button>}
      />
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Buscar categoria…" />
      <AdminTable
        columns={columns} rows={data} isLoading={isLoading}
        rowKey={(r) => r.id} emptyText="Nenhuma categoria cadastrada."
      />

      <CategoryDialog
        open={creating || !!editing}
        initial={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={(input) => upsertM.mutate(input)}
        submitting={upsertM.isPending}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá "{toDelete?.name}". Serviços vinculados podem ficar sem categoria.
            </AlertDialogDescription>
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

function CategoryDialog({
  open, initial, onClose, onSubmit, submitting,
}: {
  open: boolean; initial: AdminCategory | null;
  onClose: () => void; onSubmit: (i: UpsertCategoryInput) => void; submitting: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [order, setOrder] = useState<number>(initial?.display_order ?? 0);
  const [active, setActive] = useState(initial?.active ?? true);

  // Reset on open
  useState(() => {
    if (open) {
      setName(initial?.name ?? ""); setSlug(initial?.slug ?? "");
      setDescription(initial?.description ?? ""); setIcon(initial?.icon ?? "");
      setOrder(initial?.display_order ?? 0); setActive(initial?.active ?? true);
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); if (!initial) setSlug(slugify(e.target.value)); }} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ícone (lucide)</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="wrench" />
            </div>
            <div>
              <Label>Ordem</Label>
              <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <Label>Ativa</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={submitting || !name || !slug}
            onClick={() => onSubmit({ id: initial?.id, name, slug, description, icon, display_order: order, active })}
          >Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Reference StatusPill/DialogTrigger to avoid unused warnings in strict builds.
void StatusPill; void DialogTrigger;
