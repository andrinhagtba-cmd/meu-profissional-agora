import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Grid3x3,
  ImageIcon,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Tag,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  listServicesAdmin,
  upsertService,
  deleteService,
  listCategoriesAdmin,
  type AdminService,
  type UpsertServiceInput,
} from "@/services/adminService";
import { uploadAdminMedia } from "@/services/adminMediaService";

export const Route = createFileRoute("/_authenticated/admin/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — Admin ${BRAND_PLACEHOLDER}" },
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
    queryFn: () =>
      listServicesAdmin({ search, categoryId: categoryId || undefined }),
  });

  const upsertM = useMutation({
    mutationFn: (input: UpsertServiceInput) => upsertService(input),
    onSuccess: () => {
      toast.success("Serviço salvo");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      setEditing(null);
      setCreating(false);
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

  const rows = data ?? [];
  const total = rows.length;
  const active = rows.filter((r) => r.active).length;
  const withImage = rows.filter((r) => !!r.cover_url).length;
  const cats = categories ?? [];

  // Group by category for nice sectioning
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; items: AdminService[] }>();
    rows.forEach((r) => {
      const key = r.category_id;
      const name = r.category?.name ?? "Sem categoria";
      if (!map.has(key)) map.set(key, { name, items: [] });
      map.get(key)!.items.push(r);
    });
    return Array.from(map.entries());
  }, [rows]);

  return (
    <>
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-[oklch(0.93_0.014_258)] bg-gradient-to-br from-[oklch(0.98_0.012_258)] via-white to-[oklch(0.97_0.03_60)] p-6 sm:p-8 shadow-[0_1px_2px_oklch(0.51_0.245_262/4%),0_24px_60px_-32px_oklch(0.51_0.245_262/18%)]">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-orange/10 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/15 backdrop-blur">
              <Sparkles size={12} /> Catálogo operacional
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Serviços
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Curadoria dos serviços oferecidos em cada categoria — imagens,
              descrições e visibilidade no marketplace.
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
                placeholder="Buscar serviço…"
                className="h-11 w-64 rounded-2xl border-transparent bg-white pl-9 shadow-sm ring-1 ring-[oklch(0.93_0.014_258)] focus-visible:ring-primary"
              />
            </div>
            <Select
              value={categoryId || "__all"}
              onValueChange={(v) => setCategoryId(v === "__all" ? "" : v)}
            >
              <SelectTrigger className="h-11 w-56 rounded-2xl border-transparent bg-white shadow-sm ring-1 ring-[oklch(0.93_0.014_258)]">
                <SelectValue placeholder="Todas categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas categorias</SelectItem>
                {cats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setCreating(true)}
              disabled={!cats.length}
              className="h-11 rounded-2xl bg-primary px-5 shadow-lg shadow-primary/25 hover:bg-primary/90"
            >
              <Plus size={16} className="mr-1.5" />
              Novo serviço
            </Button>
          </div>
        </div>

        <div className="relative mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={<Grid3x3 size={20} />}
            label="Serviços"
            value={total}
            hint="No catálogo"
            loading={isLoading}
          />
          <MetricCard
            tone="emerald"
            icon={<Sparkles size={20} />}
            label="Ativos"
            value={active}
            hint={`${total ? Math.round((active / total) * 100) : 0}% publicados`}
            loading={isLoading}
          />
          <MetricCard
            tone="violet"
            icon={<ImageIcon size={20} />}
            label="Com imagem"
            value={withImage}
            hint={`${total ? Math.round((withImage / total) * 100) : 0}% cobertura`}
            loading={isLoading}
          />
          <MetricCard
            tone="orange"
            icon={<Tag size={20} />}
            label="Categorias"
            value={cats.length}
            hint="Vinculadas"
            loading={isLoading}
          />
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} hasCategories={!!cats.length} />
      ) : (
        <div className="space-y-4">
          {grouped.map(([catId, group]) => (
            <CategoryGroup
              key={catId}
              name={group.name}
              items={group.items}
              onEdit={(svc) => setEditing(svc)}
              onDelete={(svc) => setToDelete(svc)}
              onToggle={(svc, v) =>
                upsertM.mutate({
                  id: svc.id,
                  category_id: svc.category_id,
                  name: svc.name,
                  slug: svc.slug,
                  description: svc.description,
                  display_order: svc.display_order,
                  active: v,
                })
              }
            />
          ))}
        </div>
      )}

      <ServiceDialog
        open={creating || !!editing}
        initial={editing}
        categories={cats}
        defaultCategoryId={categoryId}
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
            <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá "{toDelete?.name}". Ofertas de profissionais
              vinculadas podem ser afetadas.
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

function EmptyState({
  onCreate,
  hasCategories,
}: {
  onCreate: () => void;
  hasCategories: boolean;
}) {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-[oklch(0.9_0.02_258)] bg-white/60 p-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Grid3x3 size={26} />
      </div>
      <h3 className="mt-4 font-display text-xl font-bold">
        {hasCategories ? "Nenhum serviço encontrado" : "Crie uma categoria antes"}
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {hasCategories
          ? "Ajuste os filtros ou adicione um novo serviço ao catálogo."
          : "Serviços precisam estar vinculados a uma categoria existente."}
      </p>
      {hasCategories && (
        <Button onClick={onCreate} className="mt-5 rounded-2xl">
          <Plus size={16} className="mr-1.5" /> Novo serviço
        </Button>
      )}
    </div>
  );
}

function CategoryGroup({
  name,
  items,
  onEdit,
  onDelete,
  onToggle,
}: {
  name: string;
  items: AdminService[];
  onEdit: (s: AdminService) => void;
  onDelete: (s: AdminService) => void;
  onToggle: (s: AdminService, v: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const active = items.filter((i) => i.active).length;
  const withOwn = items.filter((i) => !!i.cover_media_id).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-[oklch(0.93_0.014_258)] bg-card shadow-[0_1px_2px_oklch(0.51_0.245_262/4%)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[oklch(0.98_0.008_258)]"
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Tag size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-display text-sm font-bold text-foreground">
              {name}
            </h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {items.length}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {active} ativos · {withOwn} com imagem própria
          </p>
        </div>
        <span
          className={`grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </button>

      {open && (
        <ul className="divide-y divide-[oklch(0.94_0.014_258)] border-t border-[oklch(0.94_0.014_258)]">
          {items.map((svc) => (
            <ServiceRow
              key={svc.id}
              service={svc}
              onEdit={() => onEdit(svc)}
              onDelete={() => onDelete(svc)}
              onToggle={(v) => onToggle(svc, v)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ServiceRow({
  service,
  onEdit,
  onDelete,
  onToggle,
}: {
  service: AdminService;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (v: boolean) => void;
}) {
  const cover = service.cover_url;
  const ownImage = !!service.cover_media_id;
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 transition hover:bg-[oklch(0.985_0.006_258)] sm:gap-4 sm:px-4 sm:py-3">
      <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 to-orange/10 ring-1 ring-black/5">
        {cover ? (
          <img
            src={cover}
            alt={service.image_alt ?? service.name}
            className={`h-full w-full object-cover ${ownImage ? "" : "opacity-60"}`}
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center text-primary/40">
            <ImageIcon size={16} />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {service.name}
          </h3>
          {!ownImage && cover && (
            <span className="hidden shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
              img herdada
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          /{service.slug}
          {service.description ? ` · ${service.description}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
          #{service.display_order ?? 0}
        </span>
        <Switch
          checked={service.active}
          onCheckedChange={onToggle}
          aria-label="Ativar serviço"
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 rounded-lg p-0 hover:bg-primary/10"
          onClick={onEdit}
          aria-label="Editar"
        >
          <Pencil size={14} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 rounded-lg p-0 text-destructive hover:bg-destructive/10"
          onClick={onDelete}
          aria-label="Excluir"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </li>
  );
}

function ServiceDialog({
  open,
  initial,
  categories,
  defaultCategoryId,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  initial: AdminService | null;
  categories: { id: string; name: string }[];
  defaultCategoryId: string;
  onClose: () => void;
  onSubmit: (i: UpsertServiceInput) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [catId, setCatId] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [active, setActive] = useState(true);
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setSlug(initial?.slug ?? "");
    setDescription(initial?.description ?? "");
    setCatId(initial?.category_id ?? defaultCategoryId ?? "");
    setOrder(initial?.display_order ?? 0);
    setActive(initial?.active ?? true);
    setCoverMediaId(initial?.cover_media_id ?? null);
    setImageAlt(initial?.image_alt ?? "");
    setPreviewUrl(initial?.cover_url ?? "");
  }, [open, initial, defaultCategoryId]);

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
      const res = await uploadAdminMedia(file, "service-cover");
      setCoverMediaId(res.mediaId);
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
    setPreviewUrl("");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {initial ? "Editar serviço" : "Novo serviço"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
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
              Se vazio, usa a imagem da categoria. Ideal 1200×900 px.
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

          <div className="grid gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={catId} onValueChange={setCatId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!initial) setSlug(slugify(e.target.value));
                }}
                placeholder="Ex.: Pintura residencial"
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
                placeholder="Como esse serviço é apresentado ao público."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-[oklch(0.98_0.008_258)] px-3 py-2 ring-1 ring-[oklch(0.94_0.014_258)]">
                <Switch checked={active} onCheckedChange={setActive} />
                <Label className="mb-0 cursor-pointer">Ativo</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            disabled={submitting || uploading || !name || !slug || !catId}
            onClick={() =>
              onSubmit({
                id: initial?.id,
                name,
                slug,
                description,
                category_id: catId,
                display_order: order,
                active,
                cover_media_id: coverMediaId,
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
