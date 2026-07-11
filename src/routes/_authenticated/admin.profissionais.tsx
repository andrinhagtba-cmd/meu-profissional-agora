import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, StatusPill, InitialsAvatar, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal, BadgeCheck, Star, X, ExternalLink, Eye, Pencil,
  PauseCircle, PlayCircle, RefreshCw,
} from "lucide-react";
import {
  listPros, setProFeatured, setProVerification, bulkVerifyPros, bulkFeaturePros,
  setProProfileStatus, type AdminProRow,
} from "@/services/adminService";

const VERIF_LABEL: Record<string, string> = {
  pending: "Aguardando", approved: "Verificado", rejected: "Rejeitado",
};

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
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
  const statusMut = useMutation({
    mutationFn: (v: { id: string; s: "published" | "archived" }) => setProProfileStatus(v.id, v.s),
    onSuccess: () => { toast.success("Situação atualizada"); invalidate(); },
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

  const openDetail = (id: string, tab?: string) =>
    navigate({ to: "/_authenticated/admin/profissionais/$id", params: { id }, search: { tab: tab ?? "overview" } });

  const columns = useMemo<Column<AdminProRow>[]>(() => [
    {
      key: "name", header: "Profissional",
      cell: (p) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openDetail(p.id); }}
          className="flex items-center gap-3 text-left"
        >
          <InitialsAvatar name={p.professional_name || p.business_name} />
          <div>
            <div className="flex items-center gap-1.5 font-semibold hover:text-primary">
              {p.professional_name || p.business_name || "Sem nome"}
              {p.verification_status === "approved" && <BadgeCheck size={14} className="text-primary" />}
              {p.is_featured && <Star size={12} className="fill-orange text-orange" />}
            </div>
            <div className="text-xs text-muted-foreground">
              {p.business_name && p.professional_name ? p.business_name : (p.slug ?? "—")}
            </div>
          </div>
        </button>
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
          {VERIF_LABEL[p.verification_status] ?? p.verification_status}
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
          <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openDetail(p.id)}>
              <Eye size={14} className="mr-2" />Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDetail(p.id, "profile")}>
              <Pencil size={14} className="mr-2" />Editar perfil
            </DropdownMenuItem>
            {p.slug && (
              <DropdownMenuItem asChild>
                <Link to="/profissional/$slug" params={{ slug: p.slug }} target="_blank">
                  <ExternalLink size={14} className="mr-2" />Abrir perfil público
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {p.verification_status !== "approved" && (
              <DropdownMenuItem onClick={() => verify.mutate({ id: p.id, s: "approved" })}>
                <BadgeCheck size={14} className="mr-2 text-primary" />Aprovar verificação
              </DropdownMenuItem>
            )}
            {p.verification_status !== "rejected" && (
              <DropdownMenuItem onClick={() => verify.mutate({ id: p.id, s: "rejected" })}>
                <X size={14} className="mr-2" />Rejeitar verificação
              </DropdownMenuItem>
            )}
            {p.verification_status !== "pending" && (
              <DropdownMenuItem onClick={() => verify.mutate({ id: p.id, s: "pending" })}>
                <RefreshCw size={14} className="mr-2" />Voltar para análise
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => feat.mutate({ id: p.id, f: !p.is_featured })}>
              <Star size={14} className={`mr-2 ${p.is_featured ? "fill-orange text-orange" : ""}`} />
              {p.is_featured ? "Remover destaque" : "Destacar"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => statusMut.mutate({ id: p.id, s: "archived" })}
              className="text-destructive focus:text-destructive"
            >
              <PauseCircle size={14} className="mr-2" />Suspender perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => statusMut.mutate({ id: p.id, s: "published" })}>
              <PlayCircle size={14} className="mr-2" />Reativar perfil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [feat, verify, statusMut]);

  return (
    <div>
      <AdminPageHeader
        title="Profissionais"
        description="Aprovações, destaques e curadoria da rede de profissionais."
      />
      <AdminToolbar
        search={search}
        onSearch={(v) => { setSearch(v); setSelected(new Set()); }}
        placeholder="Buscar por nome, empresa, cidade ou slug…"
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
        onRowClick={(p) => openDetail(p.id)}
        emptyText="Nenhum profissional encontrado."
        selectable={{ selected, onToggle: toggle, onToggleAll: toggleAll }}
      />
    </div>
  );
}
