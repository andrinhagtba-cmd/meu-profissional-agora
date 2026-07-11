import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, StatusPill, InitialsAvatar, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { MoreHorizontal, BadgeCheck, Star, X, ExternalLink, Eye } from "lucide-react";
import {
  listPros, setProFeatured, setProVerification, bulkVerifyPros, bulkFeaturePros,
  type AdminProRow,
} from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/profissionais")({
  head: () => ({ meta: [{ title: "Profissionais · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminPros,
});

const FILTERS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Verificados" },
  { value: "rejected", label: "Rejeitados" },
  { value: "featured", label: "Destaques" },
];

function AdminPros() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<AdminProRow | null>(null);

  const statusFilter = filter === "featured" ? undefined : filter || undefined;
  const featuredOnly = filter === "featured" ? true : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-pros", filter, search],
    queryFn: () => listPros(statusFilter, search, featuredOnly),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-pros"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
    qc.invalidateQueries({ queryKey: ["admin-verifications"] });
  };

  const verify = useMutation({
    mutationFn: (v: { id: string; s: "approved" | "rejected" | "pending" }) => setProVerification(v.id, v.s),
    onSuccess: () => { toast.success("Status atualizado"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const feat = useMutation({
    mutationFn: (v: { id: string; f: boolean }) => setProFeatured(v.id, v.f),
    onSuccess: () => { toast.success("Destaque atualizado"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const bulkV = useMutation({
    mutationFn: (v: { ids: string[]; s: "approved" | "rejected" }) => bulkVerifyPros(v.ids, v.s),
    onSuccess: () => { toast.success("Lote aplicado"); setSelected(new Set()); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const bulkF = useMutation({
    mutationFn: (v: { ids: string[]; f: boolean }) => bulkFeaturePros(v.ids, v.f),
    onSuccess: () => { toast.success("Destaques atualizados"); setSelected(new Set()); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = (ids: string[]) => setSelected((s) => (ids.every((i) => s.has(i)) ? new Set() : new Set(ids)));

  const columns = useMemo<Column<AdminProRow>[]>(() => [
    {
      key: "name", header: "Profissional",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <InitialsAvatar name={p.professional_name || p.business_name} />
          <div>
            <div className="flex items-center gap-1.5 font-semibold">
              {p.professional_name || p.business_name || "Sem nome"}
              {p.verification_status === "approved" && <BadgeCheck size={14} className="text-primary" />}
              {p.is_featured && <Star size={12} className="fill-orange text-orange" />}
            </div>
            <div className="text-xs text-muted-foreground">
              {p.business_name && p.professional_name ? p.business_name : (p.slug ?? "—")}
            </div>
          </div>
        </div>
      ),
    },
    { key: "loc", header: "Localização", cell: (p) => <span className="text-muted-foreground">{p.city ? `${p.city}/${p.state}` : "—"}</span> },
    {
      key: "rating", header: "Reputação",
      cell: (p) => (
        <div className="text-sm">
          <span className="font-semibold">★ {p.average_rating ? Number(p.average_rating).toFixed(1) : "—"}</span>
          <span className="ml-1 text-xs text-muted-foreground">({p.reviews_count ?? 0})</span>
        </div>
      ),
    },
    {
      key: "status", header: "Verificação",
      cell: (p) => (
        <StatusPill tone={p.verification_status === "approved" ? "success" : p.verification_status === "rejected" ? "danger" : "warning"}>
          {p.verification_status}
        </StatusPill>
      ),
    },
    { key: "created", header: "Cadastro", cell: (p) => <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</span> },
    {
      key: "actions", header: "", className: "w-12 text-right",
      cell: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setPreview(p)}>
              <Eye size={14} className="mr-2" />Ver detalhes
            </DropdownMenuItem>
            {p.verification_status !== "approved" && (
              <DropdownMenuItem onClick={() => verify.mutate({ id: p.id, s: "approved" })}>
                <BadgeCheck size={14} className="mr-2 text-primary" />Aprovar
              </DropdownMenuItem>
            )}
            {p.verification_status !== "rejected" && (
              <DropdownMenuItem onClick={() => verify.mutate({ id: p.id, s: "rejected" })}>
                <X size={14} className="mr-2" />Rejeitar
              </DropdownMenuItem>
            )}
            {p.verification_status !== "pending" && (
              <DropdownMenuItem onClick={() => verify.mutate({ id: p.id, s: "pending" })}>
                Reenviar para análise
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => feat.mutate({ id: p.id, f: !p.is_featured })}>
              <Star size={14} className={`mr-2 ${p.is_featured ? "fill-orange text-orange" : ""}`} />
              {p.is_featured ? "Remover destaque" : "Destacar"}
            </DropdownMenuItem>
            {p.slug && (
              <DropdownMenuItem asChild>
                <Link to="/profissional/$slug" params={{ slug: p.slug }}>
                  <ExternalLink size={14} className="mr-2" />Ver perfil público
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [feat, verify]);

  return (
    <div>
      <AdminPageHeader
        title="Profissionais"
        description="Aprovações, destaques e curadoria da rede de profissionais."
      />
      <AdminToolbar
        search={search}
        onSearch={(v) => { setSearch(v); setSelected(new Set()); }}
        placeholder="Buscar por nome, empresa ou cidade…"
        filters={FILTERS}
        activeFilter={filter}
        onFilterChange={(v) => { setFilter(v); setSelected(new Set()); }}
        bulkBar={selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm">
            <BadgeCheck size={16} className="text-primary" />
            <span className="font-semibold">{selected.size} selecionado(s)</span>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button size="sm" onClick={() => bulkV.mutate({ ids: [...selected], s: "approved" })} disabled={bulkV.isPending}>Aprovar</Button>
              <Button size="sm" variant="outline" onClick={() => bulkV.mutate({ ids: [...selected], s: "rejected" })} disabled={bulkV.isPending}>Rejeitar</Button>
              <Button size="sm" variant="outline" onClick={() => bulkF.mutate({ ids: [...selected], f: true })} disabled={bulkF.isPending}>
                <Star size={13} className="mr-1" />Destacar
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkF.mutate({ ids: [...selected], f: false })} disabled={bulkF.isPending}>Remover destaque</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Limpar</Button>
            </div>
          </div>
        )}
      />
      <AdminTable
        columns={columns}
        rows={data}
        isLoading={isLoading}
        rowKey={(p) => p.id}
        onRowClick={(p) => setPreview(p)}
        emptyText="Nenhum profissional encontrado."
        selectable={{ selected, onToggle: toggle, onToggleAll: toggleAll }}
      />

      <Sheet open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {preview && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {preview.professional_name || preview.business_name || "Sem nome"}
                  {preview.verification_status === "approved" && <BadgeCheck size={16} className="text-primary" />}
                  {preview.is_featured && <Star size={14} className="fill-orange text-orange" />}
                </SheetTitle>
                <SheetDescription>Ficha do profissional para moderação.</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nome comercial" value={preview.business_name} />
                  <Field label="Nome público" value={preview.professional_name} />
                  <Field label="WhatsApp" value={preview.whatsapp} />
                  <Field label="Localização" value={preview.city ? `${preview.city}/${preview.state}` : null} />
                  <Field label="Reputação" value={`★ ${preview.average_rating ? Number(preview.average_rating).toFixed(1) : "—"} (${preview.reviews_count ?? 0})`} />
                  <Field label="Status" value={preview.verification_status} />
                </div>
                <Field label="Descrição" value={preview.description} />
                <Field label="Cadastrado em" value={new Date(preview.created_at).toLocaleString("pt-BR")} />
                {preview.slug && (
                  <Link to="/profissional/$slug" params={{ slug: preview.slug }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                    <ExternalLink size={14} />Abrir perfil público
                  </Link>
                )}
                <div className="flex flex-wrap gap-2 pt-4">
                  {preview.verification_status !== "approved" && (
                    <Button className="flex-1" onClick={() => { verify.mutate({ id: preview.id, s: "approved" }); setPreview(null); }}>
                      <BadgeCheck size={14} className="mr-1.5" />Aprovar
                    </Button>
                  )}
                  {preview.verification_status !== "rejected" && (
                    <Button className="flex-1" variant="outline" onClick={() => { verify.mutate({ id: preview.id, s: "rejected" }); setPreview(null); }}>
                      <X size={14} className="mr-1.5" />Rejeitar
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => { feat.mutate({ id: preview.id, f: !preview.is_featured }); setPreview(null); }}>
                    <Star size={14} className={`mr-1.5 ${preview.is_featured ? "fill-orange text-orange" : ""}`} />
                    {preview.is_featured ? "Remover destaque" : "Destacar"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 whitespace-pre-wrap text-foreground">{value || "—"}</div>
    </div>
  );
}
