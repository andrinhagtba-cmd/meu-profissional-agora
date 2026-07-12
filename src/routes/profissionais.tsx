import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfessionals } from "@/services/mockApi";

export const Route = createFileRoute("/profissionais")({
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
  const { data: pros, isLoading } = useQuery({
    queryKey: ["all-pros"],
    queryFn: getProfessionals,
  });

  return (
    <SiteLayout>
      <div className="container-page py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
              Profissionais
            </h1>
            <p className="mt-2 max-w-lg text-muted-foreground">
              Todos os profissionais da plataforma, com avaliações reais e tempo de resposta.
            </p>
          </div>
          <Button asChild variant="outline" className="h-11 rounded-xl border-border font-semibold">
            <Link to="/buscar" search={{} as never}>
              Buscar com filtros
            </Link>
          </Button>
        </div>
        {isLoading ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pros?.map((pro) => (
              <ProfessionalCard key={pro.slug} pro={pro} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
