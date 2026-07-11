import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { CategoryCard } from "@/components/shared/CategoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategories } from "@/services/categoryService";

export const Route = createFileRoute("/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias de serviços | ProConecta" },
      {
        name: "description",
        content: "Explore todas as categorias de serviços: eletricista, encanador, pintor, diarista e muito mais.",
      },
    ],
  }),
  component: CategoriasPage,
});

function CategoriasPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["categories", "list"],
    queryFn: listCategories,
    staleTime: 5 * 60_000,
  });
  const categories = data ?? [];

  return (
    <SiteLayout>
      <div className="container-page py-12">
        <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Todas as categorias
        </h1>
        <p className="mt-2 max-w-lg text-muted-foreground">
          Encontre o serviço que você precisa e compare profissionais avaliados por clientes reais.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {isLoading && categories.length === 0
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-3xl" />
              ))
            : categories.map((category) => (
                <CategoryCard key={category.slug} category={category} />
              ))}
        </div>
      </div>
    </SiteLayout>
  );
}
