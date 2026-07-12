import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdminActivity } from "@/services/adminService";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/atividade")({
  head: () => ({
    meta: [
      { title: "Atividade recente — Admin ${BRAND_PLACEHOLDER}" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AtividadePage,
});

function AtividadePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-activity-full"],
    queryFn: () => getAdminActivity(80),
  });
  return (
    <>
      <AdminPageHeader
        title="Atividade recente"
        description="Todos os eventos recentes do marketplace."
      />
      <div className="rounded-2xl border border-border bg-card p-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : (
          <ActivityFeed items={data ?? []} />
        )}
      </div>
    </>
  );
}
