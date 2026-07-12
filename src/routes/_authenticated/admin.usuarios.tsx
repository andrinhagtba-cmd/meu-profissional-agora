import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, StatusPill, InitialsAvatar, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ShieldCheck, ShieldOff, UserCog, Ban, CheckCircle2 } from "lucide-react";
import {
  listUsersFull, updateAccountStatus, bulkUpdateAccountStatus, grantRole, revokeRole,
  type AdminUserFull, type AccountStatus,
} from "@/services/adminService";
import { UserDetailDrawer } from "@/components/admin/UserDetailDrawer";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuários · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminUsers,
});

const ROLE_FILTERS = [
  { value: "", label: "Todos" },
  { value: "cliente", label: "Clientes" },
  { value: "profissional", label: "Profissionais" },
  { value: "admin", label: "Admins" },
];

function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users-full", search, role],
    queryFn: () => listUsersFull({ search, role: role || undefined }),
  });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; s: AccountStatus }) => updateAccountStatus(v.id, v.s),
    onSuccess: () => { toast.success("Status atualizado"); qc.invalidateQueries({ queryKey: ["admin-users-full"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const bulkMut = useMutation({
    mutationFn: (v: { ids: string[]; s: AccountStatus }) => bulkUpdateAccountStatus(v.ids, v.s),
    onSuccess: () => { toast.success("Ação em lote aplicada"); setSelected(new Set()); qc.invalidateQueries({ queryKey: ["admin-users-full"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const roleMut = useMutation({
    mutationFn: (v: { id: string; role: "admin" | "profissional" | "cliente"; grant: boolean }) =>
      v.grant ? grantRole(v.id, v.role) : revokeRole(v.id, v.role),
    onSuccess: () => { toast.success("Papel atualizado"); qc.invalidateQueries({ queryKey: ["admin-users-full"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = (ids: string[]) => setSelected((s) => (ids.every((i) => s.has(i)) ? new Set() : new Set(ids)));

  const columns = useMemo<Column<AdminUserFull>[]>(() => [
    {
      key: "name", header: "Usuário",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <InitialsAvatar name={u.full_name || u.email} />
          <div>
            <div className="font-semibold text-foreground">{u.full_name || "Sem nome"}</div>
            <div className="text-xs text-muted-foreground">{u.email ?? "—"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "roles", header: "Papéis",
      cell: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.length === 0 && <StatusPill tone="neutral">sem papel</StatusPill>}
          {u.roles.map((r) => (
            <StatusPill key={r} tone={r === "admin" ? "info" : r === "profissional" ? "warning" : "neutral"}>{r}</StatusPill>
          ))}
        </div>
      ),
    },
    { key: "loc", header: "Localização", cell: (u) => <span className="text-muted-foreground">{u.city ? `${u.city}/${u.state}` : "—"}</span> },
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => statusMut.mutate({ id: u.user_id, s: "active" })}>
              <CheckCircle2 size={14} className="mr-2" />Ativar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => statusMut.mutate({ id: u.user_id, s: "suspended" })}>
              <Ban size={14} className="mr-2" />Suspender
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Papéis</DropdownMenuLabel>
            {(["admin", "profissional", "cliente"] as const).map((r) => {
              const has = u.roles.includes(r);
              return (
                <DropdownMenuItem key={r} onClick={() => roleMut.mutate({ id: u.user_id, role: r, grant: !has })}>
                  {has ? <ShieldOff size={14} className="mr-2" /> : <ShieldCheck size={14} className="mr-2" />}
                  {has ? `Remover ${r}` : `Conceder ${r}`}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [roleMut, statusMut]);

  return (
    <div>
      <AdminPageHeader
        title="Usuários"
        description="Gerencie contas, papéis e status de acesso da plataforma."
      />
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por nome, email ou telefone…"
        filters={ROLE_FILTERS}
        activeFilter={role}
        onFilterChange={setRole}
        bulkBar={selected.size > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm">
            <UserCog size={16} className="text-primary" />
            <span className="font-semibold">{selected.size} selecionado(s)</span>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" onClick={() => bulkMut.mutate({ ids: [...selected], s: "active" })}>Ativar</Button>
              <Button size="sm" variant="outline" onClick={() => bulkMut.mutate({ ids: [...selected], s: "suspended" })}>Suspender</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Limpar</Button>
            </div>
          </div>
        )}
      />
      <AdminTable
        columns={columns}
        rows={data}
        isLoading={isLoading}
        rowKey={(u) => u.user_id}
        emptyText="Nenhum usuário encontrado."
        selectable={{ selected, onToggle: toggle, onToggleAll: toggleAll }}
      />
    </div>
  );
}
