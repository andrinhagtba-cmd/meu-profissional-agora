import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  Clock,
  ImageIcon,
  MapPin,
  MessageCircle,
  Phone,
  Zap,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { ProAvatar } from "@/components/shared/ProAvatar";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { RatingStars } from "@/components/shared/RatingStars";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Review } from "@/types";
import { professionals } from "@/data/professionals";
import {
  getRelatedProfessionals,
  getReviewsForProfessional,
  registerWhatsAppLead,
} from "@/services/mockApi";
import { getProfessionalPublicMediaBySlug } from "@/services/professionalMediaService";

export const Route = createFileRoute("/profissional/$slug")({
  loader: ({ params }) => {
    const pro = professionals.find((p) => p.slug === params.slug);
    if (!pro) throw notFound();
    return { pro };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.pro.name} — ${loaderData.pro.specialty} | ProConecta` },
          { name: "description", content: loaderData.pro.description.slice(0, 155) },
        ]
      : [],
  }),
  errorComponent: () => (
    <SiteLayout>
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Não foi possível carregar este perfil</h1>
        <Button asChild className="mt-6 h-11 rounded-xl"><Link to="/buscar" search={{} as never}>Voltar para a busca</Link></Button>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Profissional não encontrado</h1>
        <p className="mt-2 text-muted-foreground">O perfil pode ter sido removido ou o endereço está incorreto.</p>
        <Button asChild className="mt-6 h-11 rounded-xl"><Link to="/buscar" search={{} as never}>Buscar profissionais</Link></Button>
      </div>
    </SiteLayout>
  ),
  component: ProfilePage,
});

function ratingDistribution(reviews: Review[]) {
  const dist = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    dist[Math.round(r.rating) - 1] += 1;
  });
  return dist;
}

function ProfilePage() {
  const { pro } = Route.useLoaderData();

  const { data: reviews, isLoading: loadingReviews } = useQuery({
    queryKey: ["reviews", pro.slug],
    queryFn: () => getReviewsForProfessional(pro.slug),
  });
  const { data: related } = useQuery({
    queryKey: ["related", pro.slug],
    queryFn: () => getRelatedProfessionals(pro.slug),
  });
  const { data: dbMedia } = useQuery({
    queryKey: ["pro-media", pro.slug],
    queryFn: () => getProfessionalPublicMediaBySlug(pro.slug),
    staleTime: 5 * 60 * 1000,
  });

  const dist = reviews ? ratingDistribution(reviews) : [0, 0, 0, 0, 0];
  const totalReviews = reviews?.length ?? 0;

  const handleWhatsApp = async () => {
    await registerWhatsAppLead(pro.slug);
    toast.success("Contato registrado! Abrindo conversa (simulação)...");
  };

  const contactCard = (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Serviços a partir de
      </p>
      <p className="mt-1 font-display text-3xl font-extrabold text-foreground">
        R$ {pro.priceFrom}
      </p>
      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Clock size={15} className="text-success" aria-hidden="true" />
        Responde em até {pro.responseTime}
      </div>
      <div className="mt-5 space-y-3">
        <Button asChild className="h-12 w-full rounded-xl bg-orange font-semibold text-orange-foreground hover:bg-orange/90">
          <Link to="/pedir-orcamento" search={{ profissional: pro.slug } as never}>
            Pedir orçamento grátis
          </Link>
        </Button>
        <Button
          onClick={handleWhatsApp}
          variant="outline"
          className="h-12 w-full rounded-xl border-success/40 font-semibold text-success hover:bg-success/10 hover:text-success"
        >
          <MessageCircle size={17} aria-hidden="true" />
          Chamar no WhatsApp
        </Button>
        <Button
          onClick={() => toast.info("Telefone disponível após o primeiro contato (demonstração).")}
          variant="ghost"
          className="h-11 w-full rounded-xl font-semibold text-muted-foreground"
        >
          <Phone size={16} aria-hidden="true" />
          Ver telefone
        </Button>
      </div>
      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
        Grátis e sem compromisso. Seus dados só são compartilhados quando você decide.
      </p>
    </div>
  );

  return (
    <SiteLayout>
      <div className="border-b border-border bg-card">
        <div className="container-page py-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Início</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link to="/categoria/$slug" params={{ slug: pro.categorySlug }} className="hover:text-foreground">
              {pro.specialty}
            </Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-foreground">{pro.name}</span>
          </nav>

          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <ProAvatar initials={pro.initials} color={pro.avatarColor} size="xl" className="shrink-0" imageUrl={dbMedia?.avatarUrl || undefined} alt={pro.name} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
                    {pro.name}
                  </h1>
                  {pro.verified && (
                    <Badge className="gap-1 rounded-full bg-success/12 text-success hover:bg-success/12">
                      <BadgeCheck size={13} aria-hidden="true" /> Verificado
                    </Badge>
                  )}
                  {pro.emergency && (
                    <Badge className="gap-1 rounded-full bg-orange/12 text-orange hover:bg-orange/12">
                      <Zap size={13} aria-hidden="true" /> Emergência 24h
                    </Badge>
                  )}
                </div>
                <p className="mt-1 font-medium text-muted-foreground">
                  {pro.specialty}
                  {pro.company ? ` · ${pro.company}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                  <RatingStars rating={pro.rating} />
                  <span>({pro.reviewsCount} avaliações)</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} aria-hidden="true" />
                    {pro.city}, {pro.state} · a {pro.distanceKm} km
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Award size={14} aria-hidden="true" />
                    {pro.experienceYears} anos de experiência
                  </span>
                </div>
              </div>
            </div>
            <FavoriteButton slug={pro.slug} name={pro.name} className="shrink-0" />
          </div>
        </div>
      </div>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-12">
          <section aria-labelledby="sobre">
            <h2 id="sobre" className="font-display text-xl font-bold text-foreground">Sobre</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{pro.description}</p>
            {pro.certifications.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {pro.certifications.map((c: string) => (
                  <Badge key={c} variant="outline" className="rounded-full border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Award size={12} className="mr-1" aria-hidden="true" />
                    {c}
                  </Badge>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="servicos">
            <h2 id="servicos" className="font-display text-xl font-bold text-foreground">
              Serviços e preços
            </h2>
            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {pro.services.map((s: { name: string; priceFrom: number }) => (
                <li key={s.name} className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-sm font-medium text-foreground">{s.name}</span>
                  <span className="shrink-0 text-sm font-bold text-primary">
                    a partir de R$ {s.priceFrom}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="atendimento">
            <h2 id="atendimento" className="font-display text-xl font-bold text-foreground">
              Atendimento
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MapPin size={15} className="text-primary" aria-hidden="true" /> Regiões atendidas
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {pro.regions.join(" · ")}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarClock size={15} className="text-primary" aria-hidden="true" /> Horários
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pro.schedule}</p>
                <p className="mt-2 text-xs font-medium capitalize text-muted-foreground">
                  {pro.attendanceTypes.join(" · ")}
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="portfolio">
            <h2 id="portfolio" className="font-display text-xl font-bold text-foreground">
              Trabalhos recentes
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(dbMedia?.portfolio.length ?? 0) > 0
                ? dbMedia!.portfolio.map((item) => (
                    <figure key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                      <div className="aspect-video overflow-hidden bg-secondary">
                        {item.url ? (
                          <img src={item.url} alt={item.title ?? ""} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-primary/40">
                            <ImageIcon size={32} aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <figcaption className="px-4 py-3 text-sm font-medium text-foreground">{item.title ?? "Trabalho"}</figcaption>
                    </figure>
                  ))
                : pro.portfolio.map((item: string) => (
                    <figure key={item} className="overflow-hidden rounded-2xl border border-border bg-card">
                      <div className="flex aspect-video items-center justify-center bg-secondary text-primary/40">
                        <ImageIcon size={32} aria-hidden="true" />
                      </div>
                      <figcaption className="px-4 py-3 text-sm font-medium text-foreground">{item}</figcaption>
                    </figure>
                  ))}
            </div>
          </section>

          <section aria-labelledby="avaliacoes">
            <h2 id="avaliacoes" className="font-display text-xl font-bold text-foreground">
              Avaliações ({pro.reviewsCount})
            </h2>
            <div className="mt-4 grid gap-6 rounded-3xl border border-border bg-card p-6 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="text-center">
                <p className="font-display text-5xl font-extrabold text-foreground">
                  {pro.rating.toFixed(1).replace(".", ",")}
                </p>
                <RatingStars rating={pro.rating} showValue={false} className="mt-1 justify-center" />
                <p className="mt-1 text-xs text-muted-foreground">{pro.reviewsCount} avaliações</p>
              </div>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="w-8 shrink-0 font-medium">{stars}★</span>
                    <Progress
                      value={totalReviews ? (dist[stars - 1] / totalReviews) * 100 : 0}
                      className="h-2"
                      aria-label={`${dist[stars - 1]} avaliações de ${stars} estrelas`}
                    />
                    <span className="w-6 shrink-0 text-right">{dist[stars - 1]}</span>
                  </div>
                ))}
              </div>
            </div>
            {loadingReviews ? (
              <div className="mt-5 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            ) : (
              <ul className="mt-5 space-y-4">
                {reviews?.map((review) => (
                  <li key={review.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{review.author}</p>
                      <RatingStars rating={review.rating} showValue={false} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {review.service} · {review.city} · {review.date}
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{review.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {pro.faqs.length > 0 && (
            <section aria-labelledby="faq-pro">
              <h2 id="faq-pro" className="font-display text-xl font-bold text-foreground">
                Perguntas frequentes
              </h2>
              <Accordion type="single" collapsible className="mt-3">
                {pro.faqs.map((faq: { question: string; answer: string }, i: number) => (
                  <AccordionItem key={i} value={`f-${i}`} className="border-border">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          {related && related.length > 0 && (
            <section aria-labelledby="similares">
              <h2 id="similares" className="font-display text-xl font-bold text-foreground">
                Profissionais similares
              </h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                {related.slice(0, 2).map((p) => (
                  <ProfessionalCard key={p.slug} pro={p} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="order-first lg:order-none">
          <div className="lg:sticky lg:top-24">{contactCard}</div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md gap-2">
          <Button asChild className="h-12 flex-1 rounded-xl bg-orange font-semibold text-orange-foreground hover:bg-orange/90">
            <Link to="/pedir-orcamento" search={{ profissional: pro.slug } as never}>
              Pedir orçamento
            </Link>
          </Button>
          <Button
            onClick={handleWhatsApp}
            variant="outline"
            className="h-12 rounded-xl border-success/40 px-4 font-semibold text-success hover:bg-success/10 hover:text-success"
            aria-label="Chamar no WhatsApp"
          >
            <MessageCircle size={18} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </SiteLayout>
  );
}
