import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Eye, ShieldOff } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, StatusPill, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { listReportsAdmin, setReportStatus, type AdminReportRow } from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/denuncias")({
  head: () => ({ meta: [{ title: "Denúncias — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const FILTERS = [
  { value: "", label: "Todas" },
  { value: "open", label: "Abertas" },
  { value: "reviewing", label: "Em análise" },
  { value: "resolved", label: "Resolvidas" },
  { value: "dismissed", label: "Descartadas" },
];

function tone(s: string): "success" | "warning" | "info" | "neutral" | "danger" {
  if (s === "resolved") return "success";
  if (s === "dismissed") return "neutral";
  if (s === "reviewing") return "info";
  return "danger";
}

function Page() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", status],
    queryFn: () => listReportsAdmin(status || undefined),
  });

  const m = useMutation({
    mutationFn: (v: { id: string; s: "open" | "reviewing" | "resolved" | "dismissed" }) => setReportStatus(v.id, v.s),
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<AdminReportRow>[] = [
    {
      key: "reason", header: "Motivo", cell: (r) => (
        <div>
          <div className="font-semibold text-foreground">{r.reason}</div>
          {r.description && <div className="line-clamp-2 text-xs text-muted-foreground">{r.description}</div>}
        </div>
      ),
    },
    { key: "type", header: "Alvo", cell: (r) => r.review_id ? "Avaliação" : r.reported_user_id ? "Usuário" : "—" },
    { key: "status", header: "Status", cell: (r) => <StatusPill tone={tone(r.status)}>{r.status}</StatusPill> },
    { key: "at", header: "Criada", cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>, className: "w-28" },
    {
      key: "actions", header: "", cell: (r) => (
        <div className="flex justify-end gap-1">
          {r.status !== "reviewing" && (
            <Button size="sm" variant="ghost" onClick={() => m.mutate({ id: r.id, s: "reviewing" })} disabled={m.isPending}>
              <Eye size={14} className="mr-1" />Analisar
            </Button>
          )}
          {r.status !== "resolved" && (
            <Button size="sm" variant="ghost" onClick={() => m.mutate({ id: r.id, s: "resolved" })} disabled={m.isPending}>
              <CheckCircle2 size={14} className="mr-1 text-emerald-600" />Resolver
            </Button>
          )}
          {r.status !== "dismissed" && (
            <Button size="sm" variant="ghost" onClick={() => m.mutate({ id: r.id, s: "dismissed" })} disabled={m.isPending}>
              <ShieldOff size={14} className="mr-1 text-muted-foreground" />Descartar
            </Button>
          )}
        </div>
      ), className: "text-right",
    },
  ];

  return (
    <>
      <AdminPageHeader title="Denúncias" description="Reportes enviados por usuários da plataforma." />
      <AdminToolbar filters={FILTERS} activeFilter={status} onFilterChange={setStatus} />
      <AdminTable
        columns={columns} rows={data} isLoading={isLoading}
        rowKey={(r) => r.id} emptyText="Nenhuma denúncia registrada."
      />
    </>
  );
}
