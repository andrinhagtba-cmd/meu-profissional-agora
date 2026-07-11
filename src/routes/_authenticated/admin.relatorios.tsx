import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { fetchExportRows, getReportSummary, type ReportEntity } from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminReports,
});

const EXPORTS: { key: ReportEntity; title: string; description: string }[] = [
  { key: "pros", title: "Profissionais", description: "Base completa com verificação, cidade e destaque." },
  { key: "users", title: "Usuários", description: "Perfis, contatos e situação da conta." },
  { key: "quotes", title: "Solicitações", description: "Orçamentos abertos, ganhos e cancelados." },
  { key: "proposals", title: "Propostas", description: "Envios de propostas, preço e status." },
  { key: "reviews", title: "Avaliações", description: "Notas e status de moderação." },
  { key: "subscriptions", title: "Assinaturas", description: "Planos, ciclos e renovações." },
];

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  return lines.join("\n");
}

function download(name: string, csv: string) {
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function AdminReports() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["admin-report-summary"],
    queryFn: getReportSummary,
  });
  const [busy, setBusy] = useState<ReportEntity | null>(null);

  const handleExport = async (entity: ReportEntity, title: string) => {
    setBusy(entity);
    try {
      const rows = await fetchExportRows(entity);
      if (rows.length === 0) {
        toast.info("Nada para exportar");
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      download(`${entity}-${stamp}.csv`, toCSV(rows));
      toast.success(`${rows.length} registros exportados (${title})`);
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao exportar");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Relatórios e exports"
        description="Snapshot operacional e download de dados-chave em CSV para análise externa."
      />

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard title="Profissionais" total={summary?.pros.total} loading={isLoading}
          rows={[["Verificados", summary?.pros.approved], ["Aguardando", summary?.pros.pending], ["Destaques", summary?.pros.featured]]}
        />
        <SummaryCard title="Solicitações" total={summary?.quotes.total} loading={isLoading}
          rows={[["Em aberto", summary?.quotes.open]]}
        />
        <SummaryCard title="Propostas" total={summary?.proposals.total} loading={isLoading}
          rows={[["Aceitas", summary?.proposals.accepted]]}
        />
        <SummaryCard title="Avaliações" total={summary?.reviews.total} loading={isLoading}
          rows={[["Aguardando", summary?.reviews.pending]]}
        />
        <SummaryCard title="Usuários" total={summary?.users.total} loading={isLoading} />
        <SummaryCard title="Assinaturas" total={summary?.subscriptions.total} loading={isLoading}
          rows={[["Ativas", summary?.subscriptions.active]]}
        />
      </section>

      <section className="rounded-2xl border bg-card">
        <header className="flex items-center gap-2 border-b px-5 py-4">
          <FileSpreadsheet size={18} className="text-primary" />
          <h2 className="font-display text-lg font-bold">Exports em CSV</h2>
        </header>
        <ul className="divide-y">
          {EXPORTS.map((x) => (
            <li key={x.key} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <div className="font-semibold">{x.title}</div>
                <div className="text-xs text-muted-foreground">{x.description}</div>
              </div>
              <Button size="sm" variant="outline" disabled={busy === x.key}
                onClick={() => handleExport(x.key, x.title)}>
                {busy === x.key
                  ? <Loader2 size={14} className="mr-2 animate-spin" />
                  : <Download size={14} className="mr-2" />}
                Baixar CSV
              </Button>
            </li>
          ))}
        </ul>
        <div className="border-t px-5 py-3 text-xs text-muted-foreground">
          Cada export retorna até 2.000 registros ordenados por data de criação (mais recentes primeiro).
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  title, total, rows, loading,
}: {
  title: string;
  total?: number;
  rows?: [string, number | undefined][];
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="mt-1 font-display text-3xl font-extrabold">
        {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-muted" /> : (total ?? 0).toLocaleString("pt-BR")}
      </div>
      {rows && rows.length > 0 && (
        <dl className="mt-3 space-y-1 text-xs">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-semibold">{loading ? "…" : (v ?? 0).toLocaleString("pt-BR")}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
