import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, StatusPill, InitialsAvatar, type Column } from "@/components/admin/AdminTable";
import { UserDetailDrawer } from "@/components/admin/UserDetailDrawer";
import { listUsersFull, type AdminUserFull } from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  head: () => ({ meta: [{ title: "Clientes · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminClients,
});

function AdminClients() {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-clients", search],
    queryFn: () => listUsersFull({ search, role: "cliente" }),
  });

  const columns = useMemo<Column<AdminUserFull>[]>(() => [
    {
      key: "name", header: "Cliente",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <InitialsAvatar name={u.full_name || u.email} />
          <div>
            <div className="font-semibold">{u.full_name || "Sem nome"}</div>
            <div className="text-xs text-muted-foreground">{u.email ?? "—"}</div>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Telefone", cell: (u) => <span className="text-muted-foreground">{u.phone ?? "—"}</span> },
    { key: "loc", header: "Cidade", cell: (u) => <span className="text-muted-foreground">{u.city ? `${u.city}/${u.state}` : "—"}</span> },
    {
      key: "status", header: "Status",
      cell: (u) => {
        const s = u.account_status ?? "active";
        return <StatusPill tone={s === "active" ? "success" : s === "suspended" ? "warning" : "neutral"}>{s}</StatusPill>;
      },
    },
    { key: "created", header: "Cadastro", cell: (u) => <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</span> },
  ], []);

  return (
    <div>
      <AdminPageHeader title="Clientes" description="Todos os clientes cadastrados na plataforma." />
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Buscar cliente…" />
      <AdminTable
        columns={columns}
        rows={data}
        isLoading={isLoading}
        rowKey={(u) => u.user_id}
        emptyText="Nenhum cliente encontrado."
        onRowClick={(u) => setSelectedUserId(u.user_id)}
      />
      <UserDetailDrawer
        userId={selectedUserId}
        open={!!selectedUserId}
        onOpenChange={(o) => !o && setSelectedUserId(null)}
      />
    </div>
  );
}
