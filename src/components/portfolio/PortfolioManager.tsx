import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ImagePlus,
  Instagram,
  Loader2,
  Pencil,
  Star,
  Trash2,
  Upload,
  X,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addExternalPortfolioItem,
  addPortfolioItem,
  deletePortfolioItem,
  listPortfolio,
  moderatePortfolioItem,
  reorderPortfolioItems,
  updatePortfolioItemFields,
  type PortfolioItemVM,
} from "@/services/professionalMediaService";
import { PortfolioExternalVideoForm } from "./PortfolioExternalVideoForm";
import { MediaTypeBadge } from "./MediaTypeBadge";
import { PortfolioLightbox } from "./PortfolioLightbox";
import { isVerticalMedia } from "@/lib/portfolioUrls";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

type Tab = "image" | "instagram" | "youtube";

const MAX_MB = 8;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function validateImage(file: File): string | null {
  if (!ALLOWED_MIME.has(file.type)) return "Formato inválido. Use JPG, PNG, WebP ou AVIF.";
  if (file.size > MAX_MB * 1024 * 1024) return `Tamanho máximo ${MAX_MB}MB.`;
  return null;
}

export function PortfolioManager({
  professionalId,
  professionalUserId,
  isAdmin = false,
}: {
  professionalId: string;
  professionalUserId: string | null;
  isAdmin?: boolean;
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const uploaderId = professionalUserId ?? user?.id ?? null;
  const [tab, setTab] = useState<Tab>("image");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [editing, setEditing] = useState<PortfolioItemVM | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const q = useQuery({
    queryKey: ["portfolio-manager", professionalId],
    queryFn: () => listPortfolio(professionalId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["portfolio-manager", professionalId] });
    qc.invalidateQueries({ queryKey: ["admin-pro-portfolio", professionalId] });
    qc.invalidateQueries({ queryKey: ["my-portfolio"] });
  };

  const items = q.data ?? [];

  const handleImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!uploaderId) {
      toast.error("Sessão expirada. Entre novamente para enviar imagens.");
      return;
    }
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      const err = validateImage(file);
      if (err) {
        toast.error(`${file.name}: ${err}`);
        continue;
      }
      try {
        await addPortfolioItem(
          uploaderId,
          professionalId,
          file.name.replace(/\.[^.]+$/, ""),
          file,
        );
        ok++;
      } catch (e) {
        toast.error(`${file.name}: ${(e as Error).message}`);
      }
    }
    setUploading(false);
    if (ok) toast.success(`${ok} imagem(ns) enviada(s)${!isAdmin ? " — aguardando aprovação" : ""}`);
    invalidate();
    if (fileRef.current) fileRef.current.value = "";
  };

  const addExternal = useMutation({
    mutationFn: (p: Parameters<typeof addExternalPortfolioItem>[1]) =>
      addExternalPortfolioItem(professionalId, p),
    onSuccess: () => {
      toast.success(`Vídeo adicionado${!isAdmin ? " — aguardando aprovação" : ""}`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deletePortfolioItem(id),
    onSuccess: () => {
      toast.success("Removido");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleFeatured = useMutation({
    mutationFn: (it: PortfolioItemVM) =>
      updatePortfolioItemFields(it.id, { is_featured: !it.is_featured }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: (it: PortfolioItemVM) =>
      updatePortfolioItemFields(it.id, {
        status: it.status === "active" ? "inactive" : "active",
      }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const moderate = useMutation({
    mutationFn: (p: { id: string; status: "approved" | "rejected" }) =>
      moderatePortfolioItem(p.id, p.status),
    onSuccess: (_d, v) => {
      toast.success(v.status === "approved" ? "Aprovado" : "Rejeitado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: (payload: { fromId: string; dir: -1 | 1 }) => {
      const idx = items.findIndex((i) => i.id === payload.fromId);
      const target = idx + payload.dir;
      if (idx < 0 || target < 0 || target >= items.length) return Promise.resolve();
      const next = [...items];
      [next[idx], next[target]] = [next[target], next[idx]];
      return reorderPortfolioItems(
        professionalId,
        next.map((i) => i.id),
      );
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const previewItems = useMemo(
    () => items.filter((i) => (isAdmin ? true : i.status === "active")),
    [items, isAdmin],
  );

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { k: "image" as Tab, label: "Adicionar imagem", Icon: ImagePlus },
            { k: "instagram" as Tab, label: "Instagram Reels", Icon: Instagram },
            { k: "youtube" as Tab, label: "Vídeo do YouTube", Icon: Youtube },
          ]
        ).map(({ k, label, Icon }) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              tab === k
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Add area */}
      <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-4">
        {tab === "image" && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="hidden"
              onChange={(e) => handleImages(e.target.files)}
            />
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleImages(e.dataTransfer.files);
              }}
              className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground"
            >
              <Upload size={24} className="text-primary" />
              <p>Arraste imagens aqui ou clique para selecionar</p>
              <p className="text-xs">JPG, PNG, WebP ou AVIF · até {MAX_MB}MB · múltiplas</p>
              <Button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || !uploaderId}
                className="mt-2 rounded-xl"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                Selecionar imagens
              </Button>
            </div>
          </div>
        )}
        {tab === "instagram" && (
          <PortfolioExternalVideoForm
            kind="instagram"
            submitting={addExternal.isPending}
            onSubmit={(p) => addExternal.mutate(p)}
          />
        )}
        {tab === "youtube" && (
          <PortfolioExternalVideoForm
            kind="youtube"
            submitting={addExternal.isPending}
            onSubmit={(p) => addExternal.mutate(p)}
          />
        )}
      </div>

      {/* List */}
      {q.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <h3 className="font-display text-lg font-bold">Seu portfólio ainda está vazio</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione imagens, Reels do Instagram ou vídeos do YouTube para mostrar seus trabalhos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, i) => {
            const isImage = item.media_type === "image";
            const thumb = isImage ? item.url : item.thumbnail_url ?? "";
            const badgeCls =
              item.moderation_status === "pending"
                ? "bg-amber-100 text-amber-700"
                : item.moderation_status === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-emerald-100 text-emerald-700";

            return (
              <div key={item.id} className="group relative overflow-hidden rounded-xl border bg-card">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(previewItems.findIndex((p) => p.id === item.id))}
                  className={cn(
                    "block w-full overflow-hidden bg-muted",
                    isVerticalMedia(item.media_type) ? "aspect-[9/16]" : "aspect-square",
                  )}
                  aria-label={`Ver ${item.title ?? "item"}`}
                >
                  {thumb ? (
                    <img src={thumb} alt={item.alt_text ?? item.title ?? ""} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-neutral-900 text-white/70 text-xs">
                      {item.media_type.toUpperCase()}
                    </div>
                  )}
                </button>

                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                  <MediaTypeBadge type={item.media_type} />
                  {item.is_featured && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      <Star size={10} className="fill-current" /> Destaque
                    </span>
                  )}
                </div>

                <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", badgeCls)}>
                    {item.moderation_status}
                  </span>
                  {item.status !== "active" && (
                    <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-white">
                      inativo
                    </span>
                  )}
                </div>

                <div className="p-2">
                  <p className="truncate text-xs font-semibold">{item.title || "Sem título"}</p>
                  {(item.caption || item.description) && (
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">
                      {item.caption || item.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1 border-t bg-secondary/30 p-1.5">
                  <IconBtn label="Subir" onClick={() => move.mutate({ fromId: item.id, dir: -1 })} disabled={i === 0}>
                    <ArrowUp size={12} />
                  </IconBtn>
                  <IconBtn label="Descer" onClick={() => move.mutate({ fromId: item.id, dir: 1 })} disabled={i === items.length - 1}>
                    <ArrowDown size={12} />
                  </IconBtn>
                  <IconBtn label={item.is_featured ? "Remover destaque" : "Destacar"} onClick={() => toggleFeatured.mutate(item)}>
                    <Star size={12} className={item.is_featured ? "fill-amber-500 text-amber-500" : ""} />
                  </IconBtn>
                  <IconBtn label={item.status === "active" ? "Desativar" : "Ativar"} onClick={() => toggleStatus.mutate(item)}>
                    {item.status === "active" ? <X size={12} /> : <Check size={12} />}
                  </IconBtn>
                  <IconBtn label="Editar" onClick={() => setEditing(item)}>
                    <Pencil size={12} />
                  </IconBtn>
                  <IconBtn label="Excluir" onClick={() => del.mutate(item.id)}>
                    <Trash2 size={12} className="text-destructive" />
                  </IconBtn>
                  {isAdmin && item.moderation_status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => moderate.mutate({ id: item.id, status: "approved" })}
                      className="ml-auto rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white"
                    >
                      Aprovar
                    </button>
                  )}
                  {isAdmin && item.moderation_status !== "rejected" && (
                    <button
                      type="button"
                      onClick={() => moderate.mutate({ id: item.id, status: "rejected" })}
                      className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold text-white"
                    >
                      Rejeitar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <EditDialog item={editing} onClose={() => setEditing(null)} onSaved={invalidate} />
      )}
      <PortfolioLightbox
        items={previewItems}
        startIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-7 w-7 place-items-center rounded-md bg-white text-foreground shadow-sm ring-1 ring-border hover:bg-secondary disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function EditDialog({
  item,
  onClose,
  onSaved,
}: {
  item: PortfolioItemVM;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(item.title ?? "");
  const [caption, setCaption] = useState(item.caption ?? "");
  const [alt, setAlt] = useState(item.alt_text ?? "");
  const [description, setDescription] = useState(item.description ?? "");

  const save = useMutation({
    mutationFn: () =>
      updatePortfolioItemFields(item.id, {
        title: title.trim() || null,
        caption: caption.trim() || null,
        alt_text: alt.trim() || null,
        description: description.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Atualizado");
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar item do portfólio</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} className="mt-1" />
          </div>
          <div>
            <Label>Legenda</Label>
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={160} className="mt-1" />
          </div>
          <div>
            <Label>Texto alternativo (acessibilidade)</Label>
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={140} className="mt-1" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 size={14} className="animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
