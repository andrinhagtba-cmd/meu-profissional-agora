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
import { listFaqs, upsertFaq, deleteFaq, type AdminFaq, type UpsertFaq } from "@/services/adminContentService";

export const Route = createFileRoute("/_authenticated/admin/faqs")({
  head: () => ({ meta: [{ title: "FAQs — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminFaq | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminFaq | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-faqs", search], queryFn: () => listFaqs(search) });

  const upsertM = useMutation({
    mutationFn: upsertFaq,
    onSuccess: () => { toast.success("FAQ salva"); qc.invalidateQueries({ queryKey: ["admin-faqs"] }); setCreating(false); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteM = useMutation({
    mutationFn: deleteFaq,
    onSuccess: () => { toast.success("FAQ removida"); qc.invalidateQueries({ queryKey: ["admin-faqs"] }); setToDelete(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<AdminFaq>[] = [
    { key: "ord", header: "#", cell: (r) => <span className="text-muted-foreground">{r.display_order}</span>, className: "w-14" },
    { key: "q", header: "Pergunta", cell: (r) => (
      <div>
        <div className="font-semibold text-foreground">{r.question}</div>
        <div className="line-clamp-1 text-xs text-muted-foreground">{r.answer}</div>
      </div>
    ) },
    { key: "cat", header: "Categoria", cell: (r) => <span className="text-muted-foreground">{r.category ?? "—"}</span>, className: "w-40" },
    { key: "status", header: "Status", cell: (r) => (
      <StatusPill tone={r.is_published ? "success" : "neutral"}>{r.is_published ? "Publicada" : "Oculta"}</StatusPill>
    ), className: "w-32" },
    { key: "actions", header: "", cell: (r) => (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(r)}><Pencil size={14} /></Button>
        <Button size="sm" variant="ghost" onClick={() => setToDelete(r)}><Trash2 size={14} className="text-destructive" /></Button>
      </div>
    ), className: "w-28 text-right" },
  ];

  return (
    <>
      <AdminPageHeader title="FAQs" description="Perguntas frequentes exibidas no site." actions={<Button onClick={() => setCreating(true)}><Plus size={16} className="mr-1" />Nova FAQ</Button>} />
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Buscar pergunta ou categoria…" />
      <AdminTable columns={columns} rows={data} isLoading={isLoading} rowKey={(r) => r.id} emptyText="Nenhuma FAQ." />

      <FaqDialog open={creating || !!editing} initial={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={(i) => upsertM.mutate(i)} submitting={upsertM.isPending} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir FAQ?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.question}"</AlertDialogDescription>
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

function FaqDialog({ open, initial, onClose, onSubmit, submitting }: {
  open: boolean; initial: AdminFaq | null; onClose: () => void;
  onSubmit: (i: UpsertFaq) => void; submitting: boolean;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [published, setPublished] = useState(true);

  useEffect(() => {
    if (open) {
      setQuestion(initial?.question ?? ""); setAnswer(initial?.answer ?? "");
      setCategory(initial?.category ?? ""); setOrder(initial?.display_order ?? 0);
      setPublished(initial?.is_published ?? true);
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Editar FAQ" : "Nova FAQ"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Pergunta</Label><Input value={question} onChange={(e) => setQuestion(e.target.value)} /></div>
          <div><Label>Resposta</Label><Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={5} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Categoria</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Cliente, Profissional…" /></div>
            <div><Label>Ordem</Label><Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} /></div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={published} onCheckedChange={setPublished} /><Label>Publicada</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={submitting || !question || !answer}
            onClick={() => onSubmit({ id: initial?.id, question, answer, category, display_order: order, is_published: published })}
          >Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
