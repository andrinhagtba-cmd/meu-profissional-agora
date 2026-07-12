import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, StatusPill, type Column } from "@/components/admin/AdminTable";
import { listQuotesFull, type AdminQuoteFull } from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — Admin ${BRAND_PLACEHOLDER}" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "open", label: "Abertos" },
  { value: "receiving_proposals", label: "Recebendo propostas" },
  { value: "professional_selected", label: "Profissional selecionado" },
  { value: "in_progress", label: "Em andamento" },
  { value: "completed", label: "Concluídos" },
  { value: "cancelled", label: "Cancelados" },
];

function statusTone(s: string): "success" | "warning" | "info" | "neutral" | "danger" {
  if (s === "completed") return "success";
  if (s === "cancelled" || s === "expired") return "danger";
  if (s === "in_progress" || s === "professional_selected") return "info";
  if (s === "open" || s === "receiving_proposals") return "warning";
  return "neutral";
}

function Page() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-quotes-full", search, status],
    queryFn: () => listQuotesFull({ search, status: status || undefined }),
  });

  const columns: Column<AdminQuoteFull>[] = [
    {
      key: "title", header: "Pedido", cell: (r) => (
        <div>
          <div className="font-semibold text-foreground">{r.title}</div>
          <div className="text-xs text-muted-foreground">{r.category?.name ?? "—"}</div>
        </div>
      ),
    },
    { key: "client", header: "Cliente", cell: (r) => r.client?.full_name ?? r.client?.email ?? "—" },
    { key: "loc", header: "Local", cell: (r) => <span className="text-muted-foreground">{r.city}/{r.state}</span> },
    { key: "urg", header: "Urgência", cell: (r) => <span className="text-xs">{r.urgency ?? "—"}</span> },
    { key: "props", header: "Propostas", cell: (r) => <span className="font-semibold text-primary">{r.proposals_count ?? 0}</span>, className: "w-24 text-center" },
    { key: "status", header: "Status", cell: (r) => <StatusPill tone={statusTone(r.status)}>{r.status}</StatusPill> },
    { key: "at", header: "Criado", cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>, className: "w-28" },
  ];

  return (
    <>
      <AdminPageHeader title="Pedidos de orçamento" description="Todos os pedidos criados por clientes." />
      <AdminToolbar
        search={search} onSearch={setSearch} placeholder="Buscar pedido…"
        filters={STATUS_FILTERS} activeFilter={status} onFilterChange={setStatus}
      />
      <AdminTable
        columns={columns} rows={data} isLoading={isLoading}
        rowKey={(r) => r.id} emptyText="Nenhum pedido encontrado."
      />
    </>
  );
}
