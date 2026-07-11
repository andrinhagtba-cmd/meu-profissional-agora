import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ImageIcon,
  Layers,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/admin/MetricCard";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  listCategoriesAdmin,
  upsertCategory,
  deleteCategory,
  toggleCategoryActive,
  type AdminCategory,
  type UpsertCategoryInput,
} from "@/services/adminService";
import { uploadAdminMedia } from "@/services/adminMediaService";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias — Admin ProConecta" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
      setEditing(null);
      setCreating(false);
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
    mutationFn: (v: { id: string; active: boolean }) =>
      toggleCategoryActive(v.id, v.active),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-categories"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data ?? [];
  const total = rows.length;
  const active = rows.filter((r) => r.active).length;
  const withImage = rows.filter((r) => !!r.cover_url).length;
  const missingImage = total - withImage;

  return (
    <>
      {/* HERO */}
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-[oklch(0.93_0.014_258)] bg-gradient-to-br from-[oklch(0.98_0.012_258)] via-white to-[oklch(0.97_0.03_60)] p-6 sm:p-8 shadow-[0_1px_2px_oklch(0.51_0.245_262/4%),0_24px_60px_-32px_oklch(0.51_0.245_262/18%)]">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-orange/10 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/15 backdrop-blur">
              <Sparkles size={12} /> Curadoria de marketplace
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Categorias
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Editar imagens, ordem e visibilidade das categorias que aparecem
              na home, busca e no wizard de orçamento.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar categoria…"
                className="h-11 w-64 rounded-2xl border-transparent bg-white pl-9 shadow-sm ring-1 ring-[oklch(0.93_0.014_258)] focus-visible:ring-primary"
              />
            </div>
            <Button
              onClick={() => setCreating(true)}
              className="h-11 rounded-2xl bg-primary px-5 shadow-lg shadow-primary/25 hover:bg-primary/90"
            >
              <Plus size={16} className="mr-1.5" />
              Nova categoria
            </Button>
          </div>
        </div>

        <div className="relative mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={<Layers size={20} />}
            label="Total"
            value={total}
            hint="Categorias cadastradas"
            loading={isLoading}
          />
          <MetricCard
            tone="emerald"
            icon={<Sparkles size={20} />}
            label="Ativas"
            value={active}
            hint={`${total ? Math.round((active / total) * 100) : 0}% publicadas`}
            loading={isLoading}
          />
          <MetricCard
            tone="violet"
            icon={<ImageIcon size={20} />}
            label="Com imagem"
            value={withImage}
            hint={`${total ? Math.round((withImage / total) * 100) : 0}% cobertura visual`}
            loading={isLoading}
          />
          <MetricCard
            tone="orange"
            icon={<Upload size={20} />}
            label="Sem thumbnail"
            value={missingImage}
            hint="Priorizar upload"
            loading={isLoading}
          />
        </div>
      </section>

      {/* GRID */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-3xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onEdit={() => setEditing(cat)}
              onDelete={() => setToDelete(cat)}
              onToggle={(v) => toggleM.mutate({ id: cat.id, active: v })}
            />
          ))}
        </div>
      )}

      <CategoryDialog
        open={creating || !!editing}
        initial={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSubmit={(input) => upsertM.mutate(input)}
        submitting={upsertM.isPending}
      />

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá "{toDelete?.name}". Serviços vinculados podem ficar
              sem categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => toDelete && deleteM.mutate(toDelete.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-[oklch(0.9_0.02_258)] bg-white/60 p-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Layers size={26} />
      </div>
      <h3 className="mt-4 font-display text-xl font-bold">Nenhuma categoria</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Comece criando as principais categorias do marketplace. Elas guiam a
        navegação da home e do wizard de orçamento.
      </p>
      <Button onClick={onCreate} className="mt-5 rounded-2xl">
        <Plus size={16} className="mr-1.5" /> Nova categoria
      </Button>
    </div>
  );
}

function CategoryCard({
  category,
  onEdit,
  onDelete,
  onToggle,
}: {
  category: AdminCategory;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (v: boolean) => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-[oklch(0.93_0.014_258)] bg-card shadow-[0_1px_2px_oklch(0.51_0.245_262/4%),0_18px_40px_-26px_oklch(0.51_0.245_262/18%)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_oklch(0.51_0.245_262/6%),0_28px_60px_-24px_oklch(0.51_0.245_262/28%)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-orange/10">
        {category.cover_url ? (
          <img
            src={category.cover_url}
            alt={category.image_alt ?? category.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center text-primary/40">
            <ImageIcon size={48} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow ring-1 ring-black/5 backdrop-blur">
          #{category.display_order ?? 0}
        </div>
        <div className="absolute right-3 top-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 backdrop-blur ${
              category.active
                ? "bg-emerald-50/95 text-emerald-700 ring-emerald-200"
                : "bg-white/90 text-muted-foreground ring-black/5"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${category.active ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
            />
            {category.active ? "Ativa" : "Inativa"}
          </span>
        </div>
        <div className="absolute inset-x-4 bottom-3">
          <h3 className="line-clamp-1 font-display text-lg font-extrabold text-white drop-shadow-sm">
            {category.name}
          </h3>
          <p className="text-[11px] font-medium text-white/80">
            /{category.slug}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
          {category.description || "Sem descrição."}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-[oklch(0.94_0.014_258)] pt-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={category.active}
              onCheckedChange={onToggle}
              aria-label="Publicar categoria"
            />
            <span className="text-xs text-muted-foreground">
              {category.services_count ?? 0} serviços
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 rounded-xl p-0 hover:bg-primary/10"
              onClick={onEdit}
              aria-label="Editar"
            >
              <Pencil size={15} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 rounded-xl p-0 text-destructive hover:bg-destructive/10"
              onClick={onDelete}
              aria-label="Excluir"
            >
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function CategoryDialog({
  open,
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  initial: AdminCategory | null;
  onClose: () => void;
  onSubmit: (i: UpsertCategoryInput) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [active, setActive] = useState(true);
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setSlug(initial?.slug ?? "");
    setDescription(initial?.description ?? "");
    setIcon(initial?.icon ?? "");
    setOrder(initial?.display_order ?? 0);
    setActive(initial?.active ?? true);
    setCoverMediaId(initial?.cover_media_id ?? null);
    setImageUrl(initial?.image_url ?? null);
    setImageAlt(initial?.image_alt ?? "");
    setPreviewUrl(initial?.cover_url ?? "");
  }, [open, initial]);

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Envie uma imagem (PNG, JPG ou WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5MB)");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadAdminMedia(file, "category-cover");
      setCoverMediaId(res.mediaId);
      setImageUrl(null); // cover_media_id has priority
      setPreviewUrl(res.url);
      toast.success("Imagem enviada");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao enviar imagem");
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setCoverMediaId(null);
    setImageUrl(null);
    setPreviewUrl("");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {initial ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
          {/* IMAGE UPLOADER */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Thumbnail
            </Label>
            <div className="mt-2 overflow-hidden rounded-2xl border border-dashed border-[oklch(0.9_0.02_258)] bg-[oklch(0.98_0.008_258)]">
              <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-primary/10 to-orange/10">
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      aria-label="Remover"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <div className="grid h-full place-items-center text-primary/40">
                    <ImageIcon size={40} />
                  </div>
                )}
              </div>
              <div className="p-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl"
                >
                  <Upload size={14} className="mr-1.5" />
                  {uploading
                    ? "Enviando…"
                    : previewUrl
                      ? "Trocar imagem"
                      : "Enviar imagem"}
                </Button>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Ideal 1200×900 px. PNG, JPG ou WebP até 5MB.
            </p>
            <div className="mt-3">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Texto alternativo
              </Label>
              <Input
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Descreva a imagem"
                className="mt-1.5 h-9 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* FIELDS */}
          <div className="grid gap-3">
            <div>
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!initial) setSlug(slugify(e.target.value));
                }}
                placeholder="Ex.: Reformas & Construção"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Como essa categoria é apresentada ao público."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ícone (lucide)</Label>
                <Input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="wrench"
                />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-[oklch(0.98_0.008_258)] px-3 py-2 ring-1 ring-[oklch(0.94_0.014_258)]">
              <Switch checked={active} onCheckedChange={setActive} />
              <div>
                <Label className="mb-0 cursor-pointer">Ativa</Label>
                <p className="text-[11px] text-muted-foreground">
                  Aparece na home, busca e wizard.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            disabled={submitting || uploading || !name || !slug}
            onClick={() =>
              onSubmit({
                id: initial?.id,
                name,
                slug,
                description,
                icon,
                display_order: order,
                active,
                cover_media_id: coverMediaId,
                image_url: imageUrl,
                image_alt: imageAlt || null,
              })
            }
            className="rounded-xl bg-primary shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
