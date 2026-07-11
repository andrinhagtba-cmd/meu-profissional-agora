import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listQuotes } from "@/services/adminService";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  component: AdminQuotes,
});

const STATUS = ["", "open", "receiving_proposals", "professional_selected", "in_progress", "completed", "cancelled"];

function AdminQuotes() {
  const [filter, setFilter] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-quotes", filter],
    queryFn: () => listQuotes(filter || undefined),
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              filter === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
            }`}>{s || "Todos"}</button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Título</th>
              <th className="px-4 py-3 text-left">Local</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Criado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="p-3"><Skeleton className="h-6 w-full" /></td></tr>
              ))
            ) : !data || data.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Nenhum pedido.</td></tr>
            ) : data.map((q) => (
              <tr key={q.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{q.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{q.city}/{q.state}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{q.status}</span></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
