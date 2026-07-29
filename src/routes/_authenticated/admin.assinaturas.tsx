import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { planPeriodLabel } from "@/lib/planPeriod";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, StatusPill, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  listSubscriptionsAdmin, updateSubscriptionStatus,
  type AdminSubscriptionRow,
} from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/assinaturas")({
  head: () => ({ meta: [{ title: "Assinaturas — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
const toneFor: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  active: "success", trialing: "info", past_due: "warning",
  cancelled: "danger", expired: "neutral",
};

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subs", search, status],
    queryFn: () => listSubscriptionsAdmin({ search, status: status || undefined }),
  });

  const mutate = useMutation({
    mutationFn: (v: { id: string; status: "active" | "cancelled" | "past_due" | "trialing" }) =>
      updateSubscriptionStatus(v.id, v.status),
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["admin-subs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<AdminSubscriptionRow>[] = [
    {
      key: "pro", header: "Profissional", cell: (r) => (
        <div>
          <div className="font-semibold text-foreground">{r.professional?.professional_name ?? "—"}</div>
          <div className="text-xs text-muted-foreground">/{r.professional?.slug ?? "—"}</div>
        </div>
      ),
    },
    {
      key: "plan", header: "Plano", cell: (r) => (
        <div>
          <div className="font-medium text-foreground">{r.plan?.name ?? "—"}</div>
          <div className="text-xs text-muted-foreground">
            {r.plan ? `${brl(Number(r.plan.price))} · ${planPeriodLabel(r.plan.billing_period)}` : "—"}
          </div>
        </div>
      ),
    },
    {
      key: "started", header: "Início", cell: (r) => (
        <span className="text-muted-foreground">{fmt(r.started_at)}</span>
      ), className: "w-32",
    },
    {
      key: "expires", header: "Expira", cell: (r) => (
        <span className="text-muted-foreground">{fmt(r.expires_at)}</span>
      ), className: "w-32",
    },
    {
      key: "status", header: "Status",
      cell: (r) => <StatusPill tone={toneFor[r.status] ?? "neutral"}>{r.status}</StatusPill>,
      className: "w-32",
    },
    {
      key: "actions", header: "", cell: (r) => (
        <div className="flex justify-end gap-1">
          {r.status !== "active" && (
            <Button size="sm" variant="ghost" onClick={() => mutate.mutate({ id: r.id, status: "active" })}>
              Ativar
            </Button>
          )}
          {r.status !== "cancelled" && (
            <Button size="sm" variant="ghost" onClick={() => mutate.mutate({ id: r.id, status: "cancelled" })}>
              Cancelar
            </Button>
          )}
        </div>
      ), className: "w-40 text-right",
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Assinaturas"
        description="Assinaturas ativas, em trial ou canceladas dos profissionais."
      />
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por profissional ou plano…"
        right={
          <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="trialing">Em teste</SelectItem>
              <SelectItem value="past_due">Em atraso</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <AdminTable
        columns={columns} rows={data} isLoading={isLoading}
        rowKey={(r) => r.id} emptyText="Nenhuma assinatura encontrada."
      />
    </>
  );
}
