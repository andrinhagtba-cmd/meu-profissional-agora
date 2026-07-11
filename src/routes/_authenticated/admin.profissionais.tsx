import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, StatusPill, InitialsAvatar, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, BadgeCheck, Star, X, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { listPros, setProFeatured, setProVerification, type AdminProRow } from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/profissionais")({
  head: () => ({ meta: [{ title: "Profissionais · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminPros,
});

const FILTERS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Verificados" },
  { value: "rejected", label: "Rejeitados" },
];

function AdminPros() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-pros", filter],
    queryFn: () => listPros(filter || undefined),
  });

  const verify = useMutation({
    mutationFn: (v: { id: string; s: "approved" | "rejected" | "pending" }) => setProVerification(v.id, v.s),
    onSuccess: () => { toast.success("Status atualizado"); qc.invalidateQueries({ queryKey: ["admin-pros"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const feat = useMutation({
    mutationFn: (v: { id: string; f: boolean }) => setProFeatured(v.id, v.f),
    onSuccess: () => { toast.success("Destaque atualizado"); qc.invalidateQueries({ queryKey: ["admin-pros"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

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
            <div className="text-xs text-muted-foreground">{p.business_name && p.professional_name ? p.business_name : (p.slug ?? "—")}</div>
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
      <AdminPageHeader title="Profissionais" description="Aprovações, destaques e curadoria da rede de profissionais." />
      <AdminToolbar filters={FILTERS} activeFilter={filter} onFilterChange={setFilter} />
      <AdminTable columns={columns} rows={data} isLoading={isLoading} rowKey={(p) => p.id} emptyText="Nenhum profissional." />
    </div>
  );
}
