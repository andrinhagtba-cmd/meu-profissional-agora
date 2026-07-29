import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfessionals } from "@/services/mockApi";

export const Route = createFileRoute("/profissionais")({
  validateSearch: (search: Record<string, unknown>) => ({
    destaque: search.destaque === true || search.destaque === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Profissionais avaliados perto de você" },
      {
        name: "description",
        content: "Conheça profissionais verificados e avaliados por clientes reais em todo o Brasil.",
      },
    ],
  }),
  component: ProfissionaisPage,
});

function ProfissionaisPage() {
  const { destaque } = Route.useSearch();
  const { data: pros, isLoading } = useQuery({
    queryKey: ["all-pros"],
    queryFn: getProfessionals,
  });

  const list = destaque ? (pros ?? []).filter((p) => p.featured) : (pros ?? []);

  return (
    <SiteLayout>
      <div className="container-page py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
              {destaque ? "Profissionais em destaque" : "Profissionais"}
            </h1>
            <p className="mt-2 max-w-lg text-muted-foreground">
              {destaque
                ? "Os profissionais mais bem avaliados da semana, verificados pela nossa equipe."
                : "Todos os profissionais da plataforma, com avaliações reais e tempo de resposta."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {destaque && (
              <Button asChild variant="outline" className="h-11 rounded-xl border-border font-semibold">
                <Link to="/profissionais" search={{ destaque: undefined }}>
                  Ver todos
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="h-11 rounded-xl border-border font-semibold">
              <Link to="/buscar" search={{} as never}>
                Buscar com filtros
              </Link>
            </Button>
          </div>
        </div>
        {isLoading ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Nenhum profissional em destaque no momento.
          </p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((pro) => (
              <ProfessionalCard key={pro.slug} pro={pro} />
            ))}
          </div>
        )}

      </div>
    </SiteLayout>
  );
}
