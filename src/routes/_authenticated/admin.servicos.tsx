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
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  listServicesAdmin, upsertService, deleteService, listCategoriesAdmin,
  type AdminService, type UpsertServiceInput,
} from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/servicos")({
  head: () => ({ meta: [{ title: "Serviços — Admin ProConecta" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [editing, setEditing] = useState<AdminService | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminService | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: () => listCategoriesAdmin(""),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-services", search, categoryId],
    queryFn: () => listServicesAdmin({ search, categoryId: categoryId || undefined }),
  });

  const upsertM = useMutation({
    mutationFn: (input: UpsertServiceInput) => upsertService(input),
    onSuccess: () => {
      toast.success("Serviço salvo");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      setEditing(null); setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      toast.success("Serviço removido");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filters = [
    { value: "", label: "Todas categorias" },
    ...((categories ?? []).map((c) => ({ value: c.id, label: c.name }))),
  ];

  const columns: Column<AdminService>[] = [
    {
      key: "name", header: "Serviço", cell: (r) => (
        <div>
          <div className="font-semibold text-foreground">{r.name}</div>
          <div className="text-xs text-muted-foreground">/{r.slug}</div>
        </div>
      ),
    },
    { key: "cat", header: "Categoria", cell: (r) => r.category?.name ?? "—" },
    { key: "desc", header: "Descrição", cell: (r) => <span className="line-clamp-1 text-muted-foreground">{r.description ?? "—"}</span> },
    { key: "active", header: "Status", cell: (r) => <StatusPill tone={r.active ? "success" : "neutral"}>{r.active ? "Ativo" : "Inativo"}</StatusPill>, className: "w-28" },
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
        title="Serviços"
        description="Serviços oferecidos dentro de cada categoria."
        actions={<Button onClick={() => setCreating(true)} disabled={!categories?.length}><Plus size={16} className="mr-1" />Novo serviço</Button>}
      />
      <AdminToolbar
        search={search} onSearch={setSearch} placeholder="Buscar serviço…"
        filters={filters} activeFilter={categoryId} onFilterChange={setCategoryId}
      />
      <AdminTable
        columns={columns} rows={data} isLoading={isLoading}
        rowKey={(r) => r.id} emptyText="Nenhum serviço encontrado."
      />

      <ServiceDialog
        open={creating || !!editing}
        initial={editing}
        categories={categories ?? []}
        defaultCategoryId={categoryId}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={(input) => upsertM.mutate(input)}
        submitting={upsertM.isPending}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá "{toDelete?.name}". Ofertas de profissionais vinculadas podem ser afetadas.
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

function ServiceDialog({
  open, initial, categories, defaultCategoryId, onClose, onSubmit, submitting,
}: {
  open: boolean;
  initial: AdminService | null;
  categories: { id: string; name: string }[];
  defaultCategoryId: string;
  onClose: () => void;
  onSubmit: (i: UpsertServiceInput) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [catId, setCatId] = useState(initial?.category_id ?? defaultCategoryId ?? "");
  const [order, setOrder] = useState<number>(initial?.display_order ?? 0);
  const [active, setActive] = useState(initial?.active ?? true);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar serviço" : "Novo serviço"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Categoria</Label>
            <Select value={catId} onValueChange={setCatId}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
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
              <Label>Ordem</Label>
              <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={active} onCheckedChange={setActive} />
              <Label>Ativo</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={submitting || !name || !slug || !catId}
            onClick={() => onSubmit({ id: initial?.id, name, slug, description, category_id: catId, display_order: order, active })}
          >Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
