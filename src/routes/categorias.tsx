import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { CategoryCard } from "@/components/shared/CategoryCard";
import { categories } from "@/data/categories";

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
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
