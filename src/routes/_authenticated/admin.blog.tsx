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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listBlogPosts, upsertBlogPost, deleteBlogPost, slugify, type AdminBlogPost, type UpsertBlogPost } from "@/services/adminContentService";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  head: () => ({ meta: [{ title: "Blog — Admin ProConecta" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const FILTERS = [
  { value: "", label: "Todos" },
  { value: "draft", label: "Rascunhos" },
  { value: "published", label: "Publicados" },
];

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<AdminBlogPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminBlogPost | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-blog", search, status],
    queryFn: () => listBlogPosts(search, status || undefined),
  });

  const upsertM = useMutation({
    mutationFn: upsertBlogPost,
    onSuccess: () => {
      toast.success("Post salvo");
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      setCreating(false); setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteM = useMutation({
    mutationFn: deleteBlogPost,
    onSuccess: () => { toast.success("Post removido"); qc.invalidateQueries({ queryKey: ["admin-blog"] }); setToDelete(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<AdminBlogPost>[] = [
    { key: "title", header: "Título", cell: (r) => (
      <div>
        <div className="font-semibold text-foreground">{r.title}</div>
        <div className="text-xs text-muted-foreground">/{r.slug}</div>
      </div>
    ) },
    { key: "cat", header: "Categoria", cell: (r) => <span className="text-muted-foreground">{r.category ?? "—"}</span> },
    { key: "author", header: "Autor", cell: (r) => <span className="text-muted-foreground">{r.author ?? "—"}</span> },
    { key: "status", header: "Status", cell: (r) => (
      <StatusPill tone={r.status === "published" ? "success" : "neutral"}>
        {r.status === "published" ? "Publicado" : "Rascunho"}
      </StatusPill>
    ), className: "w-32" },
    { key: "at", header: "Atualizado", cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString("pt-BR")}</span>, className: "w-28" },
    { key: "actions", header: "", cell: (r) => (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(r)}><Pencil size={14} /></Button>
        <Button size="sm" variant="ghost" onClick={() => setToDelete(r)}><Trash2 size={14} className="text-destructive" /></Button>
      </div>
    ), className: "w-28 text-right" },
  ];

  return (
    <>
      <AdminPageHeader
        title="Blog"
        description="Publique artigos e dicas para os usuários da plataforma."
        actions={<Button onClick={() => setCreating(true)}><Plus size={16} className="mr-1" />Novo post</Button>}
      />
      <AdminToolbar
        search={search} onSearch={setSearch} placeholder="Buscar por título, slug, autor…"
        filters={FILTERS} activeFilter={status} onFilterChange={setStatus}
      />
      <AdminTable columns={columns} rows={data} isLoading={isLoading} rowKey={(r) => r.id} emptyText="Nenhum post encontrado." />

      <PostDialog
        open={creating || !!editing}
        initial={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={(i) => upsertM.mutate(i)}
        submitting={upsertM.isPending}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir post?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.title}" será removido permanentemente.</AlertDialogDescription>
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

function PostDialog({ open, initial, onClose, onSubmit, submitting }: {
  open: boolean; initial: AdminBlogPost | null; onClose: () => void;
  onSubmit: (i: UpsertBlogPost) => void; submitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? ""); setSlug(initial?.slug ?? "");
      setExcerpt(initial?.excerpt ?? ""); setContent(initial?.content ?? "");
      setCover(initial?.cover_url ?? ""); setAuthor(initial?.author ?? "");
      setCategory(initial?.category ?? ""); setStatus(initial?.status ?? "draft");
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{initial ? "Editar post" : "Novo post"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Título</Label>
              <Input value={title} onChange={(e) => { setTitle(e.target.value); if (!initial) setSlug(slugify(e.target.value)); }} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
            </div>
          </div>
          <div>
            <Label>Resumo</Label>
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Conteúdo (markdown/html)</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Autor</Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>URL da capa</Label>
              <Input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={submitting || !title || !slug}
            onClick={() => onSubmit({ id: initial?.id, title, slug, excerpt, content, cover_url: cover, author, category, status })}
          >Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
