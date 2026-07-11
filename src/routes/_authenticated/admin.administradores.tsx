import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, StatusPill, InitialsAvatar, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { ShieldOff, ShieldCheck, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { listUsersFull, grantRole, revokeRole, type AdminUserFull } from "@/services/adminService";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/administradores")({
  head: () => ({ meta: [{ title: "Administradores · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminAdmins,
});

function AdminAdmins() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-admins", search],
    queryFn: () => listUsersFull({ search, role: "admin" }),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => revokeRole(id, "admin"),
    onSuccess: () => { toast.success("Admin removido"); qc.invalidateQueries({ queryKey: ["admin-admins"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const grant = useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.from("profiles").select("user_id").eq("email", email).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Usuário não encontrado. Peça para se cadastrar primeiro.");
      await grantRole(data.user_id, "admin");
    },
    onSuccess: () => {
      toast.success("Admin concedido");
      setDialogOpen(false); setNewEmail("");
      qc.invalidateQueries({ queryKey: ["admin-admins"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns = useMemo<Column<AdminUserFull>[]>(() => [
    {
      key: "name", header: "Administrador",
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
    { key: "roles", header: "Papéis", cell: (u) => (
      <div className="flex flex-wrap gap-1">{u.roles.map((r) => <StatusPill key={r} tone="info">{r}</StatusPill>)}</div>
    ) },
    { key: "created", header: "Desde", cell: (u) => <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</span> },
    {
      key: "actions", header: "", className: "text-right",
      cell: (u) => (
        <Button size="sm" variant="outline" onClick={() => revoke.mutate(u.user_id)} disabled={revoke.isPending}>
          <ShieldOff size={14} className="mr-1.5" />Remover admin
        </Button>
      ),
    },
  ], [revoke]);

  return (
    <div>
      <AdminPageHeader
        title="Administradores"
        description="Controle quem tem acesso ao console administrativo."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus size={14} className="mr-1.5" />Conceder acesso admin</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conceder acesso admin</DialogTitle>
                <DialogDescription>
                  Informe o email de um usuário já cadastrado. Ele passará a acessar o painel administrativo.
                </DialogDescription>
              </DialogHeader>
              <Input placeholder="email@dominio.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => grant.mutate(newEmail.trim())} disabled={!newEmail || grant.isPending}>
                  <ShieldCheck size={14} className="mr-1.5" />Conceder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Buscar admin…" />
      <AdminTable columns={columns} rows={data} isLoading={isLoading} rowKey={(u) => u.user_id} emptyText="Nenhum administrador." />
    </div>
  );
}
