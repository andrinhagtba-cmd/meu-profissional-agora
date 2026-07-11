import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listReviews, setReviewStatus } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Star, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/avaliacoes")({
  component: AdminReviews,
});

function AdminReviews() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", filter],
    queryFn: () => listReviews(filter || undefined),
  });

  const mutate = useMutation({
    mutationFn: (v: { id: string; s: "approved" | "rejected" | "pending" }) => setReviewStatus(v.id, v.s),
    onSuccess: () => { toast.success("Status atualizado"); qc.invalidateQueries({ queryKey: ["admin-reviews"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { v: "", l: "Todas" },
          { v: "pending", l: "Pendentes" },
          { v: "approved", l: "Aprovadas" },
          { v: "rejected", l: "Rejeitadas" },
        ].map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              filter === f.v ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
            }`}>{f.l}</button>
        ))}
      </div>
      <div className="space-y-3">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        : !data || data.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhuma avaliação.</p>
        ) : data.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-orange"><Star size={14} className="fill-orange" />{r.rating}</span>
                  <span className="text-sm font-semibold">{r.professional?.professional_name ?? "—"}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    r.status === "approved" ? "bg-green-100 text-green-800" :
                    r.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                  }`}>{r.status}</span>
                </div>
                
                {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                <p className="mt-1 text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="flex gap-2">
                {r.status !== "approved" && (
                  <Button size="sm" onClick={() => mutate.mutate({ id: r.id, s: "approved" })} disabled={mutate.isPending}>
                    <Check size={14} className="mr-1" />Aprovar
                  </Button>
                )}
                {r.status !== "rejected" && (
                  <Button size="sm" variant="outline" onClick={() => mutate.mutate({ id: r.id, s: "rejected" })} disabled={mutate.isPending}>
                    <X size={14} className="mr-1" />Rejeitar
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
