import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, StatusPill, type Column } from "@/components/admin/AdminTable";
import { listProposalsAdmin, type AdminProposalRow } from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/propostas")({
  head: () => ({ meta: [{ title: "Propostas — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const STATUS_FILTERS = [
  { value: "", label: "Todas" },
  { value: "sent", label: "Enviadas" },
  { value: "viewed", label: "Visualizadas" },
  { value: "accepted", label: "Aceitas" },
  { value: "rejected", label: "Rejeitadas" },
  { value: "withdrawn", label: "Retiradas" },
];

function tone(s: string): "success" | "warning" | "info" | "neutral" | "danger" {
  if (s === "accepted") return "success";
  if (s === "rejected" || s === "withdrawn") return "danger";
  if (s === "viewed") return "info";
  if (s === "sent") return "warning";
  return "neutral";
}

function Page() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-proposals", search, status],
    queryFn: () => listProposalsAdmin({ search, status: status || undefined }),
  });

  const columns: Column<AdminProposalRow>[] = [
    {
      key: "quote", header: "Pedido", cell: (r) => (
        <div>
          <div className="font-semibold text-foreground">{r.quote_request?.title ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{r.quote_request?.city}/{r.quote_request?.state}</div>
        </div>
      ),
    },
    { key: "pro", header: "Profissional", cell: (r) => r.professional?.professional_name ?? "—" },
    {
      key: "price", header: "Valor", cell: (r) => (
        <span className="font-semibold">
          {r.estimated_price ? `R$ ${Number(r.estimated_price).toLocaleString("pt-BR")}` : "—"}
        </span>
      ), className: "w-32",
    },
    { key: "deadline", header: "Prazo", cell: (r) => <span className="text-xs text-muted-foreground">{r.estimated_deadline ?? "—"}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusPill tone={tone(r.status)}>{r.status}</StatusPill> },
    { key: "at", header: "Enviada", cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>, className: "w-28" },
  ];

  return (
    <>
      <AdminPageHeader title="Propostas" description="Todas as propostas enviadas por profissionais." />
      <AdminToolbar
        search={search} onSearch={setSearch} placeholder="Buscar por pedido ou profissional…"
        filters={STATUS_FILTERS} activeFilter={status} onFilterChange={setStatus}
      />
      <AdminTable
        columns={columns} rows={data} isLoading={isLoading}
        rowKey={(r) => r.id} emptyText="Nenhuma proposta encontrada."
      />
    </>
  );
}
