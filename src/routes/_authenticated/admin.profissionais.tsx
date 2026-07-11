import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listPros, setProFeatured, setProVerification } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, Star, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/profissionais")({
  component: AdminPros,
});

function AdminPros() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-pros", filter],
    queryFn: () => listPros(filter || undefined),
  });

  const verify = useMutation({
    mutationFn: (v: { id: string; s: "approved" | "rejected" | "pending" }) => setProVerification(v.id, v.s),
    onSuccess: () => { toast.success("Status atualizado"); qc.invalidateQueries({ queryKey: ["admin-pros"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const feat = useMutation({
    mutationFn: (v: { id: string; f: boolean }) => setProFeatured(v.id, v.f),
    onSuccess: () => { toast.success("Destaque atualizado"); qc.invalidateQueries({ queryKey: ["admin-pros"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { v: "", l: "Todos" },
          { v: "pending", l: "Pendentes" },
          { v: "approved", l: "Verificados" },
          { v: "rejected", l: "Rejeitados" },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              filter === f.v ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >{f.l}</button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : !data || data.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhum profissional.</p>
        ) : (
          data.map((p) => (
            <div key={p.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-card p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{p.professional_name || p.business_name || "Sem nome"}</h3>
                  {p.verification_status === "approved" && <BadgeCheck size={16} className="text-primary" />}
                  {p.is_featured && <Star size={14} className="fill-orange text-orange" />}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    p.verification_status === "approved" ? "bg-green-100 text-green-800" :
                    p.verification_status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                  }`}>{p.verification_status}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.city ? `${p.city}/${p.state}` : "—"} · ★ {p.average_rating ? Number(p.average_rating).toFixed(1) : "—"} ({p.reviews_count ?? 0})
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.verification_status !== "approved" && (
                  <Button size="sm" onClick={() => verify.mutate({ id: p.id, s: "approved" })} disabled={verify.isPending}>
                    <BadgeCheck size={14} className="mr-1" />Verificar
                  </Button>
                )}
                {p.verification_status !== "rejected" && (
                  <Button size="sm" variant="outline" onClick={() => verify.mutate({ id: p.id, s: "rejected" })} disabled={verify.isPending}>
                    <X size={14} className="mr-1" />Rejeitar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => feat.mutate({ id: p.id, f: !p.is_featured })} disabled={feat.isPending}>
                  <Star size={14} className={`mr-1 ${p.is_featured ? "fill-orange text-orange" : ""}`} />
                  {p.is_featured ? "Remover destaque" : "Destacar"}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
