import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, StatusPill, InitialsAvatar, type Column } from "@/components/admin/AdminTable";
import { UserDetailDrawer } from "@/components/admin/UserDetailDrawer";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteUserFn } from "@/lib/adminUsers.functions";
import { listUsersFull, type AdminUserFull } from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  head: () => ({ meta: [{ title: "Clientes · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminClients,
});

function AdminClients() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminUserFull | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-clients", search],
    queryFn: () => listUsersFull({ search, role: "cliente" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteUserFn({ data: { userId: id } }),
    onSuccess: () => {
      toast.success("Cliente removido");
      setToDelete(null);
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      qc.invalidateQueries({ queryKey: ["admin-users-full"] });
    },
    onError: (e: Error) => toast.error(e.message),
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
    {
      key: "actions", header: "", className: "w-12 text-right",
      cell: (u) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label="Remover cliente"
          onClick={(e) => { e.stopPropagation(); setToDelete(u); }}
        >
          <Trash2 size={16} />
        </Button>
      ),
    },
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
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.full_name || toDelete?.email || "Este cliente"} será excluído permanentemente,
              junto com o perfil e os papéis de acesso. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
              onClick={(e) => { e.preventDefault(); if (toDelete) deleteMut.mutate(toDelete.user_id); }}
            >
              {deleteMut.isPending ? "Removendo…" : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
