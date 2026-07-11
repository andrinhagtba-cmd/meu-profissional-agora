import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Crown, KeyRound, Search, ShieldCheck, Sparkles, UserMinus, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { InitialsAvatar, StatusPill } from "@/components/admin/AdminTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  grantRole,
  listRoleUsers,
  revokeRole,
  searchProfilesByEmail,
  type AdminRoleUserRow,
  type AppRole,
} from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/permissoes")({
  head: () => ({ meta: [{ title: "Permissões · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: PermissoesPage,
});

const ROLE_META: Record<AppRole, { label: string; description: string; icon: React.ComponentType<{ size?: number }>; tone: "info" | "warning" | "success" | "danger" | "neutral" }> = {
  admin: { label: "Administradores", description: "Acesso completo ao painel operacional", icon: Crown, tone: "danger" },
  profissional: { label: "Profissionais", description: "Gestão de perfil, serviços e propostas", tone: "info", icon: ShieldCheck },
  cliente: { label: "Clientes", description: "Solicitação de orçamentos e avaliações", tone: "success", icon: Users },
};

function PermissoesPage() {
  const qc = useQueryClient();
  const [role, setRole] = useState<AppRole>("admin");
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-role-users", role],
    queryFn: () => listRoleUsers(role),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.full_name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q));
  }, [users, search]);

  const revoke = useMutation({
    mutationFn: (v: { userId: string; role: AppRole }) => revokeRole(v.userId, v.role),
    onSuccess: () => {
      toast.success("Papel removido");
      qc.invalidateQueries({ queryKey: ["admin-role-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-5 shadow-float sm:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_30%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_45%),radial-gradient(circle_at_55%_70%,color-mix(in_oklab,var(--orange)_14%,transparent),transparent_35%)] lg:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles size={14} /> Governança
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">Papéis & Permissões</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Distribua o acesso do painel entre administradores, profissionais e clientes. Todas as alterações ficam registradas nos logs de auditoria.
            </p>
          </div>
          <GrantRoleDialog defaultRole={role} onGranted={() => qc.invalidateQueries({ queryKey: ["admin-role-users"] })} />
        </div>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
          {(Object.keys(ROLE_META) as AppRole[]).map((r) => {
            const meta = ROLE_META[r];
            const Icon = meta.icon;
            const active = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`group flex items-start gap-4 rounded-2xl border p-4 text-left transition ${active ? "border-primary bg-primary/5 shadow-card" : "border-border/70 bg-background hover:border-primary/30"}`}
              >
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-extrabold text-foreground">{meta.label}</h3>
                    <StatusPill tone={meta.tone}>{users && r === role ? users.length : ""}</StatusPill>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{meta.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* LIST */}
      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-extrabold text-foreground">{ROLE_META[role].label}</h2>
            <p className="text-xs text-muted-foreground">{filtered.length} usuário(s)</p>
          </div>
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email…"
              className="h-11 rounded-full border-border/80 bg-background pl-9 shadow-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Nenhum usuário com este papel. Use "Conceder papel" para adicionar.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((u) => (
              <UserRoleCard key={u.user_id} u={u} role={role} onRevoke={() => revoke.mutate({ userId: u.user_id, role })} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function UserRoleCard({ u, role, onRevoke }: { u: AdminRoleUserRow; role: AppRole; onRevoke: () => void }) {
  return (
    <li className="rounded-2xl border border-border/60 bg-background p-4 transition hover:border-primary/30 hover:shadow-card">
      <div className="flex items-start gap-3">
        <InitialsAvatar name={u.full_name} src={u.avatar_url ?? undefined} className="h-11 w-11" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-sm font-extrabold text-foreground">{u.full_name || "Sem nome"}</h3>
          <p className="truncate text-xs text-muted-foreground">{u.email || "—"}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {u.roles.map((r) => (
              <StatusPill key={r} tone={ROLE_META[r]?.tone ?? "neutral"}>{r}</StatusPill>
            ))}
            {u.account_status === "suspended" && <StatusPill tone="danger">suspenso</StatusPill>}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="rounded-full text-destructive hover:bg-destructive/10">
              <UserMinus size={14} className="mr-1" /> Remover papel
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover papel "{role}"?</AlertDialogTitle>
              <AlertDialogDescription>
                {u.full_name || u.email} perderá o acesso associado a este papel imediatamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onRevoke}>Remover</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}

function GrantRoleDialog({ defaultRole, onGranted }: { defaultRole: AppRole; onGranted: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<AppRole>(defaultRole);
  const [selected, setSelected] = useState<{ user_id: string; email: string | null; full_name: string | null } | null>(null);

  const { data: results = [] } = useQuery({
    queryKey: ["admin-user-search", query],
    queryFn: () => searchProfilesByEmail(query),
    enabled: open && query.length >= 2,
  });

  const grant = useMutation({
    mutationFn: () => grantRole(selected!.user_id, role),
    onSuccess: () => {
      toast.success(`Papel "${role}" concedido`);
      onGranted();
      setOpen(false);
      setSelected(null);
      setQuery("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full shadow-card">
          <UserPlus size={16} className="mr-2" /> Conceder papel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Conceder papel</DialogTitle>
          <DialogDescription>Busque um usuário por email ou nome e escolha o papel a conceder.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex gap-2">
              {(Object.keys(ROLE_META) as AppRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${role === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}
                >
                  {ROLE_META[r].label.replace("Administradores", "Admin").replace("Profissionais", "Profissional").replace("Clientes", "Cliente")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Input value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }} placeholder="Buscar por email ou nome…" className="rounded-xl" />
          </div>
          {query.length >= 2 && (
            <ul className="max-h-60 overflow-auto rounded-xl border">
              {results.length === 0 ? (
                <li className="p-4 text-center text-sm text-muted-foreground">Nenhum resultado</li>
              ) : (
                results.map((r) => (
                  <li key={r.user_id}>
                    <button
                      type="button"
                      onClick={() => setSelected(r)}
                      className={`flex w-full items-center gap-3 p-3 text-left transition hover:bg-muted ${selected?.user_id === r.user_id ? "bg-primary/10" : ""}`}
                    >
                      <InitialsAvatar name={r.full_name} src={r.avatar_url ?? undefined} className="h-9 w-9" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-foreground">{r.full_name || "Sem nome"}</div>
                        <div className="truncate text-xs text-muted-foreground">{r.email}</div>
                      </div>
                      {selected?.user_id === r.user_id && <KeyRound size={16} className="text-primary" />}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" className="rounded-full" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button className="rounded-full" disabled={!selected || grant.isPending} onClick={() => grant.mutate()}>
            Conceder {ROLE_META[role].label.replace("Administradores", "admin").replace("Profissionais", "profissional").replace("Clientes", "cliente")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
