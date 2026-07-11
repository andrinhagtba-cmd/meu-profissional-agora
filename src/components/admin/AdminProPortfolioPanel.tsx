import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Pencil, Save, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  listPortfolio, addPortfolioItem, deletePortfolioItem, type PortfolioItemVM,
} from "@/services/professionalMediaService";
import { updatePortfolioItem } from "@/services/adminService";

export function AdminProPortfolioPanel({
  professionalId, professionalUserId,
}: { professionalId: string; professionalUserId: string | null }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<PortfolioItemVM | null>(null);
  const [deleting, setDeleting] = useState<PortfolioItemVM | null>(null);

  const q = useQuery({
    queryKey: ["admin-pro-portfolio", professionalId],
    queryFn: () => listPortfolio(professionalId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-pro-portfolio", professionalId] });
    qc.invalidateQueries({ queryKey: ["admin-pro-detail", professionalId] });
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!professionalUserId) {
      toast.error("Este profissional ainda não possui usuário vinculado.");
      return;
    }
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        await addPortfolioItem(professionalUserId, professionalId, file.name.replace(/\.[^.]+$/, ""), file);
        ok++;
      } catch (e) {
        toast.error(`Falha em ${file.name}: ${(e as Error).message}`);
      }
    }
    setUploading(false);
    if (ok > 0) toast.success(`${ok} imagem${ok > 1 ? "ns" : ""} adicionada${ok > 1 ? "s" : ""}`);
    invalidate();
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = useMutation({
    mutationFn: (id: string) => deletePortfolioItem(id),
    onSuccess: () => { toast.success("Item removido"); invalidate(); setDeleting(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <div>
          <CardTitle className="text-base">Portfólio</CardTitle>
          <p className="text-xs text-muted-foreground">Imagens de trabalhos realizados. Aparecem na página pública do profissional.</p>
        </div>
        <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <ImagePlus size={14} className="mr-1.5" /> {uploading ? "Enviando…" : "Enviar imagens"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </CardHeader>
      <CardContent>
        {q.isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
          </div>
        )}
        {!q.isLoading && (q.data?.length ?? 0) === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            <Upload className="mx-auto mb-2 h-6 w-6 opacity-60" />
            Nenhuma imagem no portfólio.
            {professionalUserId && <div className="mt-1 text-xs">Clique em “Enviar imagens” para começar.</div>}
          </div>
        )}
        {(q.data?.length ?? 0) > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {q.data!.map((item) => (
              <div key={item.id} className="group relative overflow-hidden rounded-xl border bg-card">
                <div className="aspect-square bg-muted">
                  {item.url ? (
                    <img src={item.url} alt={item.title ?? "Portfólio"} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sem prévia</div>
                  )}
                </div>
                <div className="p-2">
                  <div className="truncate text-xs font-medium">{item.title || "Sem título"}</div>
                  {item.description && <div className="line-clamp-1 text-[11px] text-muted-foreground">{item.description}</div>}
                </div>
                <div className="absolute inset-x-2 top-2 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => setEditing(item)}>
                    <Pencil size={12} />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => setDeleting(item)}>
                    <Trash2 size={12} className="text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {editing && (
        <EditItemDialog
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { invalidate(); setEditing(null); }}
        />
      )}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover imagem?</AlertDialogTitle>
            <AlertDialogDescription>
              A imagem "{deleting?.title || "sem título"}" será removida do portfólio.
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

function EditItemDialog({
  item, onClose, onSaved,
}: { item: PortfolioItemVM; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(item.title ?? "");
  const [description, setDescription] = useState(item.description ?? "");
  const [sort, setSort] = useState(String(item.sort_order ?? 0));

  const save = useMutation({
    mutationFn: async () => {
      const sortNum = Number(sort);
      await updatePortfolioItem(item.id, {
        title: title.trim() || null,
        description: description.trim() || null,
        sort_order: Number.isFinite(sortNum) ? sortNum : 0,
      });
    },
    onSuccess: () => { toast.success("Item atualizado"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Editar imagem</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {item.url && (
            <img src={item.url} alt="Prévia" className="max-h-64 w-full rounded-lg border object-contain" />
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Descrição</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Ordem de exibição</Label>
            <Input inputMode="numeric" value={sort} onChange={(e) => setSort(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save size={14} className="mr-1.5" /> Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
