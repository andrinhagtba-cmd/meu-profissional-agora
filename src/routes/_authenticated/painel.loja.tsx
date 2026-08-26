import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { ProStoreEditor } from "@/components/painel/ProStoreEditor";
import { BusinessHoursSection } from "@/components/professional/BusinessHoursSection";
import { getMyStoreProfile } from "@/services/proStoreService";

export const Route = createFileRoute("/_authenticated/painel/loja")({
  head: () => ({
    meta: [
      { title: "Minha loja" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MinhaLojaPage,
});

function MinhaLojaPage() {
  const { user } = useAuth();
  const { data: pro, isLoading } = useQuery({
    queryKey: ["my-store", user?.id],
    enabled: !!user?.id,
    queryFn: () => getMyStoreProfile(user!.id),
  });

  return (
    <SiteLayout>
      <div className="container-page py-10 lg:py-14">
        <p className="text-sm text-muted-foreground">
          <Link to="/painel" className="hover:text-primary">← Voltar ao painel</Link>
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground lg:text-4xl">
              Minha loja
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Atualize a descrição, o endereço, as formas de atendimento e as regiões que você atende.
              Essas informações aparecem no seu perfil público e na busca.
            </p>
          </div>
          {pro?.slug && (
            <Button asChild variant="outline" className="h-11 rounded-xl border-border font-semibold">
              <Link to="/profissional/$slug" params={{ slug: pro.slug }} target="_blank">
                <ExternalLink size={16} /> Ver perfil público
              </Link>
            </Button>
          )}
        </div>

        <div className="mt-8 space-y-6">
          {isLoading ? (
            <div className="space-y-4 rounded-3xl border border-border bg-card p-8 shadow-card">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          ) : !pro ? (
            <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-card">
              <h2 className="font-display text-xl font-extrabold text-foreground">
                Você ainda não tem um perfil profissional
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                Crie seu cadastro profissional para publicar sua loja, receber orçamentos e aparecer na busca.
              </p>
              <Button asChild className="mt-5 h-12 rounded-xl px-6 font-semibold">
                <Link to="/cadastro/profissional">Criar perfil profissional</Link>
              </Button>
            </div>
          ) : (
            <>
              <ProStoreEditor pro={pro} />
              <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  Horário de funcionamento
                </h2>
                <div className="mt-4">
                  <BusinessHoursSection professionalId={pro.id} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
