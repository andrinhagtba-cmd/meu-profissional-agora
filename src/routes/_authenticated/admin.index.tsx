import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "@/services/adminService";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, MessageSquare, Star, ClipboardList, ShieldCheck, Flag } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
  });

  const cards = [
    { icon: <Users />, label: "Usuários", value: data?.users, color: "primary" },
    { icon: <Briefcase />, label: "Profissionais", value: data?.pros, color: "primary" },
    { icon: <ClipboardList />, label: "Pedidos", value: data?.quotes, color: "primary" },
    { icon: <MessageSquare />, label: "Propostas", value: data?.proposals, color: "primary" },
    { icon: <Star />, label: "Avaliações", value: data?.reviews, color: "primary" },
    { icon: <ShieldCheck />, label: "Profissionais pendentes", value: data?.pendingPros, color: "orange" },
    { icon: <Star />, label: "Avaliações pendentes", value: data?.pendingReviews, color: "orange" },
    { icon: <Flag />, label: "Denúncias abertas", value: data?.openReports, color: "orange" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <span className={`grid h-10 w-10 place-items-center rounded-xl bg-secondary ${c.color === "orange" ? "text-orange" : "text-primary"}`}>
              {c.icon}
            </span>
            <div>
              <div className="text-xs font-medium text-muted-foreground">{c.label}</div>
              <div className="mt-0.5 text-2xl font-extrabold text-foreground">
                {isLoading ? <Skeleton className="h-7 w-12" /> : (c.value ?? 0)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
