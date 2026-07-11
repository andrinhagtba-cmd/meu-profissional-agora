import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminTable, StatusPill, InitialsAvatar, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { BadgeCheck, X, ExternalLink, Eye } from "lucide-react";
import {
  listVerificationQueue, bulkVerifyPros, setProVerification,
  type AdminVerificationRow,
} from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/verificacoes")({
  head: () => ({ meta: [{ title: "Verificações · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminVerifications,
});

const FILTERS = [
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Rejeitados" },
];

function AdminVerifications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<AdminVerificationRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-verifications", filter],
    queryFn: () => listVerificationQueue(filter),
  });

  const single = useMutation({
    mutationFn: (v: { id: string; s: "approved" | "rejected" }) => setProVerification(v.id, v.s),
    onSuccess: () => { toast.success("Aplicado"); qc.invalidateQueries({ queryKey: ["admin-verifications"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const bulk = useMutation({
    mutationFn: (v: { ids: string[]; s: "approved" | "rejected" }) => bulkVerifyPros(v.ids, v.s),
    onSuccess: () => { toast.success("Lote aplicado"); setSelected(new Set()); qc.invalidateQueries({ queryKey: ["admin-verifications"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = (ids: string[]) => setSelected((s) => (ids.every((i) => s.has(i)) ? new Set() : new Set(ids)));

  const columns = useMemo<Column<AdminVerificationRow>[]>(() => [
    {
      key: "name", header: "Profissional",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <InitialsAvatar name={p.professional_name || p.business_name} />
          <div>
            <div className="font-semibold">{p.professional_name || p.business_name || "Sem nome"}</div>
            <div className="text-xs text-muted-foreground">{p.slug ?? "—"}</div>
          </div>
        </div>
      ),
    },
    { key: "contact", header: "WhatsApp", cell: (p) => <span className="text-muted-foreground">{p.whatsapp ?? "—"}</span> },
    { key: "loc", header: "Localização", cell: (p) => <span className="text-muted-foreground">{p.city ? `${p.city}/${p.state}` : "—"}</span> },
    { key: "status", header: "Status", cell: (p) => (
      <StatusPill tone={p.verification_status === "approved" ? "success" : p.verification_status === "rejected" ? "danger" : "warning"}>{p.verification_status}</StatusPill>
    ) },
    { key: "created", header: "Solicitado", cell: (p) => <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</span> },
    {
      key: "actions", header: "", className: "w-64 text-right",
      cell: (p) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => setPreview(p)}><Eye size={14} /></Button>
          <Button size="sm" onClick={() => single.mutate({ id: p.id, s: "approved" })} disabled={single.isPending}>
            <BadgeCheck size={14} className="mr-1" />Aprovar
          </Button>
          <Button size="sm" variant="outline" onClick={() => single.mutate({ id: p.id, s: "rejected" })} disabled={single.isPending}>
            <X size={14} />
          </Button>
        </div>
      ),
    },
  ], [single]);

  return (
    <div>
      <AdminPageHeader
        title="Verificações"
        description="Fila de profissionais aguardando análise documental e liberação."
      />
      <AdminToolbar
        filters={FILTERS}
        activeFilter={filter}
        onFilterChange={(v) => { setFilter(v); setSelected(new Set()); }}
        bulkBar={selected.size > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm">
            <BadgeCheck size={16} className="text-primary" />
            <span className="font-semibold">{selected.size} selecionado(s)</span>
            <div className="ml-auto flex gap-2">
              <Button size="sm" onClick={() => bulk.mutate({ ids: [...selected], s: "approved" })}>Aprovar todos</Button>
              <Button size="sm" variant="outline" onClick={() => bulk.mutate({ ids: [...selected], s: "rejected" })}>Rejeitar todos</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Limpar</Button>
            </div>
          </div>
        )}
      />
      <AdminTable
        columns={columns}
        rows={data}
        isLoading={isLoading}
        rowKey={(p) => p.id}
        emptyText="Nenhum profissional nesta lista."
        selectable={{ selected, onToggle: toggle, onToggleAll: toggleAll }}
      />

      <Sheet open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {preview && (
            <>
              <SheetHeader>
                <SheetTitle>{preview.professional_name || preview.business_name}</SheetTitle>
                <SheetDescription>Dados enviados pelo profissional para verificação.</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <Field label="Nome comercial" value={preview.business_name} />
                <Field label="Nome público" value={preview.professional_name} />
                <Field label="WhatsApp" value={preview.whatsapp} />
                <Field label="Localização" value={preview.city ? `${preview.city}/${preview.state}` : null} />
                <Field label="Descrição" value={preview.description} />
                <Field label="Status" value={preview.verification_status} />
                <Field label="Solicitado em" value={new Date(preview.created_at).toLocaleString("pt-BR")} />
                {preview.slug && (
                  <Link to="/profissional/$slug" params={{ slug: preview.slug }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                    <ExternalLink size={14} />Abrir perfil público
                  </Link>
                )}
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={() => { single.mutate({ id: preview.id, s: "approved" }); setPreview(null); }}>
                    <BadgeCheck size={14} className="mr-1.5" />Aprovar
                  </Button>
                  <Button className="flex-1" variant="outline" onClick={() => { single.mutate({ id: preview.id, s: "rejected" }); setPreview(null); }}>
                    <X size={14} className="mr-1.5" />Rejeitar
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 whitespace-pre-wrap text-foreground">{value || "—"}</div>
    </div>
  );
}
