import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Image as ImageIcon, Pencil, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, StatusPill, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { listBanners, upsertBanner, deleteBanner, toggleBannerActive, type AdminBanner, type UpsertBanner } from "@/services/adminContentService";
import { uploadAdminMedia } from "@/services/adminMediaService";



export const Route = createFileRoute("/_authenticated/admin/banners")({
  head: () => ({ meta: [{ title: "Banners — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const POSITIONS = [
  { value: "", label: "Todas posições" },
  { value: "hero", label: "Hero (Home)" },
  { value: "home", label: "Home" },
  { value: "top", label: "Topo" },
  { value: "sidebar", label: "Lateral" },
  { value: "footer", label: "Rodapé" },
];

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminBanner | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-banners", search, position],
    queryFn: () => listBanners(search, position || undefined),
  });

  const upsertM = useMutation({
    mutationFn: upsertBanner,
    onSuccess: () => { toast.success("Banner salvo"); qc.invalidateQueries({ queryKey: ["admin-banners"] }); setCreating(false); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteM = useMutation({
    mutationFn: deleteBanner,
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["admin-banners"] }); setToDelete(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const togM = useMutation({
    mutationFn: (v: { id: string; on: boolean }) => toggleBannerActive(v.id, v.on),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  const columns: Column<AdminBanner>[] = [
    { key: "img", header: "", cell: (r) => (
      <div className="h-12 w-20 overflow-hidden rounded-lg bg-secondary">
        {r.image_url
          ? <img src={r.image_url} alt="" className="h-full w-full object-cover" />
          : <div className="grid h-full w-full place-items-center text-primary/40"><ImageIcon size={16} /></div>}
      </div>
    ), className: "w-24" },
    { key: "title", header: "Título", cell: (r) => (
      <div>
        <div className="font-semibold text-foreground">{r.title}</div>
        <div className="line-clamp-1 text-xs text-muted-foreground">{r.subtitle ?? "—"}</div>
      </div>
    ) },
    { key: "pos", header: "Posição", cell: (r) => <StatusPill tone="info">{r.position}</StatusPill>, className: "w-28" },
    { key: "vig", header: "Vigência", cell: (r) => (
      <span className="text-xs text-muted-foreground">
        {r.starts_at ? new Date(r.starts_at).toLocaleDateString("pt-BR") : "—"}
        {" → "}
        {r.ends_at ? new Date(r.ends_at).toLocaleDateString("pt-BR") : "∞"}
      </span>
    ) },
    { key: "active", header: "Ativo", cell: (r) => (
      <Switch checked={r.is_active} onCheckedChange={(v) => togM.mutate({ id: r.id, on: v })} />
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
      <AdminPageHeader title="Banners" description="Banners promocionais e institucionais do site."
        actions={<Button onClick={() => setCreating(true)}><Plus size={16} className="mr-1" />Novo banner</Button>} />
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Buscar título…"
        filters={POSITIONS} activeFilter={position} onFilterChange={setPosition} />
      <AdminTable columns={columns} rows={data} isLoading={isLoading} rowKey={(r) => r.id} emptyText="Nenhum banner." />

      <BannerDialog open={creating || !!editing} initial={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={(i) => upsertM.mutate(i)} submitting={upsertM.isPending} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir banner?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.title}" será removido.</AlertDialogDescription>
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

function BannerDialog({ open, initial, onClose, onSubmit, submitting }: {
  open: boolean; initial: AdminBanner | null; onClose: () => void;
  onSubmit: (i: UpsertBanner) => void; submitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [highlight, setHighlight] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [image, setImage] = useState("");
  const [link, setLink] = useState("");
  const [position, setPosition] = useState("hero");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [active, setActive] = useState(true);
  const [ctaPLabel, setCtaPLabel] = useState("");
  const [ctaPHref, setCtaPHref] = useState("");
  const [ctaSLabel, setCtaSLabel] = useState("");
  const [ctaSHref, setCtaSHref] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? ""); setSubtitle(initial?.subtitle ?? "");
      setHighlight(initial?.highlight_text ?? "");
      setImage(initial?.image_url ?? ""); setLink(initial?.link_url ?? "");
      setPosition(initial?.position ?? "hero");
      setStarts(initial?.starts_at?.slice(0, 10) ?? ""); setEnds(initial?.ends_at?.slice(0, 10) ?? "");
      setOrder(initial?.display_order ?? 0); setActive(initial?.is_active ?? true);
      setCtaPLabel(initial?.cta_primary_label ?? "");
      setCtaPHref(initial?.cta_primary_href ?? "");
      setCtaSLabel(initial?.cta_secondary_label ?? "");
      setCtaSHref(initial?.cta_secondary_href ?? "");
    }
  }, [open, initial]);

  const isHero = position === "hero";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Editar banner" : "Novo banner"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Título</Label>
            <Textarea value={title} onChange={(e) => setTitle(e.target.value)} rows={2} placeholder="Ex: Encontre as {{highlight}} do DF em um só lugar." />
            {isHero && <p className="mt-1 text-xs text-muted-foreground">Use <code>{"{{highlight}}"}</code> onde o texto destacado (manuscrito laranja) deve aparecer.</p>}
          </div>
          {isHero && (
            <div>
              <Label>Texto destacado (manuscrito)</Label>
              <Input value={highlight} onChange={(e) => setHighlight(e.target.value)} placeholder="melhores empresas" />
            </div>
          )}
          <div><Label>{isHero ? "Descrição" : "Subtítulo"}</Label><Textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} rows={2} /></div>
          <ImageUploadField
            label={isHero ? "Imagem desktop (1920x1088)" : "Imagem do banner"}
            value={image}
            onChange={setImage}
          />
          <ImageUploadField
            label="Imagem mobile (vertical, 1024x1536)"
            hint="Opcional — se vazio, usamos a imagem desktop no celular."
            value={imageMobile}
            onChange={setImageMobile}
          />
          {!isHero && (
            <div><Label>Link de destino</Label><Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/ ou https://…" /></div>
          )}

          {isHero && (
            <div className="grid gap-3 rounded-lg border border-border bg-secondary/30 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Botões de ação</div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Botão principal — rótulo</Label><Input value={ctaPLabel} onChange={(e) => setCtaPLabel(e.target.value)} placeholder="Encontrar profissional" /></div>
                <div><Label>Botão principal — link</Label><Input value={ctaPHref} onChange={(e) => setCtaPHref(e.target.value)} placeholder="/buscar" /></div>
                <div><Label>Botão secundário — rótulo</Label><Input value={ctaSLabel} onChange={(e) => setCtaSLabel(e.target.value)} placeholder="Pedir orçamento" /></div>
                <div><Label>Botão secundário — link</Label><Input value={ctaSHref} onChange={(e) => setCtaSHref(e.target.value)} placeholder="/pedir-orcamento" /></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Posição</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Hero (Home)</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="top">Topo</SelectItem>
                  <SelectItem value="sidebar">Lateral</SelectItem>
                  <SelectItem value="footer">Rodapé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Início</Label><Input type="date" value={starts} onChange={(e) => setStarts(e.target.value)} /></div>
            <div><Label>Fim</Label><Input type="date" value={ends} onChange={(e) => setEnds(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div><Label>Ordem {isHero && <span className="text-xs text-muted-foreground">(2+ vira slider)</span>}</Label><Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} /></div>
            <div className="flex items-center gap-2"><Switch checked={active} onCheckedChange={setActive} /><Label>Ativo</Label></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={submitting || !title}
            onClick={() => onSubmit({
              id: initial?.id, title, subtitle, image_url: image, image_url_mobile: imageMobile || null, link_url: link, position,
              highlight_text: highlight || null,
              cta_primary_label: ctaPLabel || null,
              cta_primary_href: ctaPHref || null,
              cta_secondary_label: ctaSLabel || null,
              cta_secondary_href: ctaSHref || null,
              starts_at: starts ? new Date(starts).toISOString() : null,
              ends_at: ends ? new Date(ends).toISOString() : null,
              display_order: order, is_active: active,
            })}
          >Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImageUploadField({ value, onChange, label = "Imagem do banner", hint }: { value: string; onChange: (url: string) => void; label?: string; hint?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadAdminMedia(file, "banner");
      onChange(res.url);
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="mt-1 flex items-center gap-3 rounded-lg border border-border p-2 w-full min-w-0 overflow-hidden">
          <img src={value} alt="Prévia" className="h-20 w-32 shrink-0 rounded-md object-cover" />
          <div className="flex min-w-0 flex-1 gap-2">
            <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Upload size={14} className="mr-1" />}
              Trocar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>
              <Trash2 size={14} className="mr-1 text-destructive" /> Remover
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="mt-1 flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/30 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          {uploading ? (
            <><Loader2 size={20} className="animate-spin" /><span>Enviando…</span></>
          ) : (
            <><Upload size={20} /><span>Clique para enviar imagem</span></>
          )}
        </button>
      )}
    </div>
  );
}

