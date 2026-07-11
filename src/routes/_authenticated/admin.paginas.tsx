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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { listSitePages, upsertSitePage, deleteSitePage, slugify, type AdminSitePage, type UpsertSitePage } from "@/services/adminContentService";

export const Route = createFileRoute("/_authenticated/admin/paginas")({
  head: () => ({ meta: [{ title: "Páginas — Admin ProConecta" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminSitePage | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminSitePage | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-pages", search], queryFn: () => listSitePages(search) });

  const upsertM = useMutation({
    mutationFn: upsertSitePage,
    onSuccess: () => { toast.success("Página salva"); qc.invalidateQueries({ queryKey: ["admin-pages"] }); setCreating(false); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteM = useMutation({
    mutationFn: deleteSitePage,
    onSuccess: () => { toast.success("Removida"); qc.invalidateQueries({ queryKey: ["admin-pages"] }); setToDelete(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<AdminSitePage>[] = [
    { key: "title", header: "Título", cell: (r) => (
      <div>
        <div className="font-semibold text-foreground">{r.title}</div>
        <div className="text-xs text-muted-foreground">/{r.slug}</div>
      </div>
    ) },
    { key: "meta", header: "Descrição meta", cell: (r) => <span className="line-clamp-1 text-muted-foreground">{r.meta_description ?? "—"}</span> },
    { key: "status", header: "Status", cell: (r) => (
      <StatusPill tone={r.is_published ? "success" : "neutral"}>{r.is_published ? "Publicada" : "Rascunho"}</StatusPill>
    ), className: "w-32" },
    { key: "at", header: "Atualizada", cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString("pt-BR")}</span>, className: "w-28" },
    { key: "actions", header: "", cell: (r) => (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(r)}><Pencil size={14} /></Button>
        <Button size="sm" variant="ghost" onClick={() => setToDelete(r)}><Trash2 size={14} className="text-destructive" /></Button>
      </div>
    ), className: "w-28 text-right" },
  ];

  return (
    <>
      <AdminPageHeader title="Páginas" description="Páginas institucionais (sobre, termos, política de privacidade…)."
        actions={<Button onClick={() => setCreating(true)}><Plus size={16} className="mr-1" />Nova página</Button>} />
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Buscar título ou slug…" />
      <AdminTable columns={columns} rows={data} isLoading={isLoading} rowKey={(r) => r.id} emptyText="Nenhuma página." />

      <PageDialog open={creating || !!editing} initial={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={(i) => upsertM.mutate(i)} submitting={upsertM.isPending} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir página?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.title}" será removida.</AlertDialogDescription>
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

function PageDialog({ open, initial, onClose, onSubmit, submitting }: {
  open: boolean; initial: AdminSitePage | null; onClose: () => void;
  onSubmit: (i: UpsertSitePage) => void; submitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [meta, setMeta] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? ""); setSlug(initial?.slug ?? "");
      setMeta(initial?.meta_description ?? ""); setContent(initial?.content ?? "");
      setPublished(initial?.is_published ?? false);
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{initial ? "Editar página" : "Nova página"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Título</Label>
              <Input value={title} onChange={(e) => { setTitle(e.target.value); if (!initial) setSlug(slugify(e.target.value)); }} />
            </div>
            <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} /></div>
          </div>
          <div><Label>Meta description (SEO)</Label><Textarea value={meta} onChange={(e) => setMeta(e.target.value)} rows={2} maxLength={160} /></div>
          <div><Label>Conteúdo</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} /></div>
          <div className="flex items-center gap-2"><Switch checked={published} onCheckedChange={setPublished} /><Label>Publicada</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={submitting || !title || !slug}
            onClick={() => onSubmit({ id: initial?.id, title, slug, meta_description: meta, content, is_published: published })}
          >Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
