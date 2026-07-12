import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, InitialsAvatar, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { listTestimonials, upsertTestimonial, deleteTestimonial, toggleTestimonialPublish, type AdminTestimonial, type UpsertTestimonial } from "@/services/adminContentService";

export const Route = createFileRoute("/_authenticated/admin/depoimentos")({
  head: () => ({ meta: [{ title: "Depoimentos — Admin ${BRAND_PLACEHOLDER}" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminTestimonial | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminTestimonial | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-testimonials", search],
    queryFn: () => listTestimonials(search),
  });

  const upsertM = useMutation({
    mutationFn: upsertTestimonial,
    onSuccess: () => { toast.success("Depoimento salvo"); qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); setCreating(false); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteM = useMutation({
    mutationFn: deleteTestimonial,
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); setToDelete(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const togM = useMutation({
    mutationFn: (v: { id: string; on: boolean }) => toggleTestimonialPublish(v.id, v.on),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-testimonials"] }),
  });

  const columns: Column<AdminTestimonial>[] = [
    { key: "author", header: "Autor", cell: (r) => (
      <div className="flex items-center gap-3">
        <InitialsAvatar name={r.author} />
        <div>
          <div className="font-semibold text-foreground">{r.author}</div>
          <div className="text-xs text-muted-foreground">{[r.role, r.company].filter(Boolean).join(" · ") || "—"}</div>
        </div>
      </div>
    ) },
    { key: "content", header: "Depoimento", cell: (r) => <span className="line-clamp-2 text-sm text-muted-foreground">"{r.content}"</span> },
    { key: "rating", header: "Nota", cell: (r) => (
      <span className="inline-flex items-center gap-1 text-sm font-semibold">
        <Star size={13} className="fill-amber-400 text-amber-400" />{r.rating ?? 5}
      </span>
    ), className: "w-20" },
    { key: "pub", header: "Publicado", cell: (r) => (
      <Switch checked={r.is_published} onCheckedChange={(v) => togM.mutate({ id: r.id, on: v })} />
    ), className: "w-24" },
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
        title="Depoimentos"
        description="Depoimentos exibidos na home e páginas institucionais."
        actions={<Button onClick={() => setCreating(true)}><Plus size={16} className="mr-1" />Novo</Button>}
      />
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Buscar autor, empresa ou trecho…" />
      <AdminTable columns={columns} rows={data} isLoading={isLoading} rowKey={(r) => r.id} emptyText="Nenhum depoimento." />

      <TestimonialDialog
        open={creating || !!editing} initial={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={(i) => upsertM.mutate(i)} submitting={upsertM.isPending}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir depoimento?</AlertDialogTitle>
            <AlertDialogDescription>O depoimento de "{toDelete?.author}" será removido.</AlertDialogDescription>
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

function TestimonialDialog({ open, initial, onClose, onSubmit, submitting }: {
  open: boolean; initial: AdminTestimonial | null; onClose: () => void;
  onSubmit: (i: UpsertTestimonial) => void; submitting: boolean;
}) {
  const [author, setAuthor] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [order, setOrder] = useState<number>(0);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (open) {
      setAuthor(initial?.author ?? ""); setRole(initial?.role ?? ""); setCompany(initial?.company ?? "");
      setContent(initial?.content ?? ""); setRating(initial?.rating ?? 5);
      setOrder(initial?.display_order ?? 0); setPublished(initial?.is_published ?? false);
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Editar depoimento" : "Novo depoimento"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Autor</Label><Input value={author} onChange={(e) => setAuthor(e.target.value)} /></div>
            <div><Label>Cargo</Label><Input value={role} onChange={(e) => setRole(e.target.value)} /></div>
          </div>
          <div><Label>Empresa</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
          <div><Label>Depoimento</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nota (1-5)</Label><Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} /></div>
            <div><Label>Ordem</Label><Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} /></div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={published} onCheckedChange={setPublished} /><Label>Publicado</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={submitting || !author || !content}
            onClick={() => onSubmit({ id: initial?.id, author, role, company, content, rating, display_order: order, is_published: published })}
          >Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
