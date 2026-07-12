import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { getProfessionals } from "@/services/mockApi";

export const Route = createFileRoute("/_authenticated/favoritos")({
  head: () => ({
    meta: [
      { title: "Meus favoritos" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  const { favorites } = useFavorites();
  const { data: all, isLoading } = useQuery({
    queryKey: ["professionals-all"],
    queryFn: getProfessionals,
  });

  const list = (all ?? []).filter((p) => favorites.includes(p.slug));

  return (
    <SiteLayout>
      <div className="container-page py-10 lg:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground lg:text-4xl">
              Meus favoritos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {list.length} profissional{list.length === 1 ? "" : "is"} salvo{list.length === 1 ? "" : "s"}.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/buscar" search={{} as never}>Buscar profissionais</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center">
            <Heart className="mx-auto text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">
              Você ainda não favoritou nenhum profissional. Toque no coração em um card para salvar.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((pro) => (
              <ProfessionalCard key={pro.slug} pro={pro} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
