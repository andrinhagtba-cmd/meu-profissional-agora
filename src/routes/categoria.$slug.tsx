import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Star, Users } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categories, cities } from "@/data/categories";
import { images } from "@/data/images";
import { getProfessionalsByCategory } from "@/services/mockApi";

export const Route = createFileRoute("/categoria/$slug")({
  loader: ({ params }) => {
    const category = categories.find((c) => c.slug === params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.category.name} perto de você | ProConecta` },
          { name: "description", content: loaderData.category.description },
        ]
      : [],
  }),
  errorComponent: () => (
    <SiteLayout>
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Não foi possível carregar esta categoria</h1>
        <Button asChild className="mt-6 h-11 rounded-xl"><Link to="/categorias">Ver categorias</Link></Button>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Categoria não encontrada</h1>
        <p className="mt-2 text-muted-foreground">Ela pode ter sido removida ou o endereço está incorreto.</p>
        <Button asChild className="mt-6 h-11 rounded-xl"><Link to="/categorias">Ver todas as categorias</Link></Button>
      </div>
    </SiteLayout>
  ),
  component: CategoriaPage,
});

function CategoriaPage() {
  const { category } = Route.useLoaderData();
  const { data: pros, isLoading } = useQuery({
    queryKey: ["category-pros", category.slug],
    queryFn: () => getProfessionalsByCategory(category.slug),
  });

  const related = categories.filter((c) => c.slug !== category.slug).slice(0, 4);

  return (
    <SiteLayout>
      <div className="relative overflow-hidden bg-navy">
        <img
          src={images[category.imageKey]}
          alt=""
          loading="lazy"
          width={800}
          height={1000}
          className="absolute inset-0 h-full w-full object-cover opacity-25"
          aria-hidden="true"
        />
        <div className="container-page relative py-14 text-navy-foreground">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-navy-foreground/70">
            <Link to="/" className="hover:text-navy-foreground">Início</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link to="/categorias" className="hover:text-navy-foreground">Categorias</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-navy-foreground">{category.name}</span>
          </nav>
          <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
            {category.name} perto de você
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-navy-foreground/85">
            {category.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-medium">
            <span className="inline-flex items-center gap-1.5">
              <Users size={15} aria-hidden="true" />
              {category.professionalsCount} profissionais
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star size={15} className="fill-rating text-rating" aria-hidden="true" />
              Nota média {category.rating.toFixed(1).replace(".", ",")}
            </span>
            <span>
              a partir de <strong>R$ {category.priceFrom}</strong>
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="h-12 rounded-xl bg-orange px-6 font-semibold text-orange-foreground hover:bg-orange/90">
              <Link to="/pedir-orcamento">Pedir orçamento</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-xl border-navy-foreground/25 bg-transparent px-6 font-semibold text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"
            >
              <Link to="/buscar" search={{ categoria: category.slug } as never}>
                Buscar com filtros
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container-page py-12">
        <section aria-labelledby="servicos-categoria">
          <h2 id="servicos-categoria" className="font-display text-xl font-bold text-foreground">
            Serviços mais pedidos
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {category.services.map((s: string) => (
              <Badge key={s} className="rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold text-primary hover:bg-secondary">
                {s}
              </Badge>
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="profissionais-categoria">
          <h2 id="profissionais-categoria" className="font-display text-2xl font-extrabold text-foreground">
            Profissionais disponíveis
          </h2>
          {isLoading ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-3xl" />
              ))}
            </div>
          ) : pros && pros.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pros.map((pro) => (
                <ProfessionalCard key={pro.slug} pro={pro} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-border bg-card py-14 text-center">
              <p className="font-medium text-foreground">Ainda não há profissionais nesta categoria por aqui.</p>
              <p className="mt-1 text-sm text-muted-foreground">Publique um pedido e seja avisado quando houver.</p>
              <Button asChild className="mt-5 h-11 rounded-xl font-semibold">
                <Link to="/pedir-orcamento">Pedir orçamento</Link>
              </Button>
            </div>
          )}
        </section>

        <section className="mt-14 grid gap-10 lg:grid-cols-[1fr_320px]" aria-labelledby="faq-categoria">
          <div>
            <h2 id="faq-categoria" className="font-display text-2xl font-extrabold text-foreground">
              Perguntas frequentes
            </h2>
            <Accordion type="single" collapsible className="mt-4">
              {category.faqs.map((faq: { question: string; answer: string }, i: number) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <aside>
            <h2 className="font-display text-lg font-bold text-foreground">Cidades atendidas</h2>
            <ul className="mt-3 space-y-1.5">
              {cities.slice(0, 6).map((city) => (
                <li key={city}>
                  <Link
                    to="/buscar"
                    search={{ categoria: category.slug, cidade: city } as never}
                    className="text-sm text-primary hover:underline"
                  >
                    {category.name} em {city}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="mt-8 font-display text-lg font-bold text-foreground">Categorias relacionadas</h2>
            <ul className="mt-3 space-y-1.5">
              {related.map((c) => (
                <li key={c.slug}>
                  <Link
                    to="/categoria/$slug"
                    params={{ slug: c.slug }}
                    className="text-sm text-primary hover:underline"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </div>
    </SiteLayout>
  );
}
