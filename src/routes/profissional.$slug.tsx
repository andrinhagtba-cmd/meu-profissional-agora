import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  Clock,
  Eye,
  Facebook,
  Globe,
  ImageIcon,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  Zap,
} from "lucide-react";
import { publicAddressLabel, mapsSearchUrl } from "@/lib/proAddress";
import { normalizeExternalUrl } from "@/lib/externalUrl";
import { BusinessHoursCard, OpenNowBadge } from "@/components/professional/BusinessHoursCard";
import { getPublicBusinessHours } from "@/services/businessHoursService";
import { hasAnyHours, WEEKDAY_SHORT, dayLabel } from "@/lib/businessHours";
import { LocationMap } from "@/components/address/LocationMap";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { ProAvatar } from "@/components/shared/ProAvatar";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { RatingStars } from "@/components/shared/RatingStars";
import { PublicPortfolioGrid } from "@/components/portfolio/PublicPortfolioGrid";
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
import { professionals } from "@/data/professionals";
import {
  getRelatedProfessionals,
} from "@/services/mockApi";
import { listApprovedReviewsBySlug, getProfessionalBySlug, type PublicReview } from "@/services/professionalService";
import { buildWhatsAppUrl, formatBrazilPhone, normalizeWhatsAppPhone } from "@/lib/whatsapp";
import { useEffect, useRef, useState } from "react";
import { Copy } from "lucide-react";
import { registerProfileView } from "@/lib/viewTracker";
import { formatViewsLabel, formatProfileViews } from "@/lib/formatViews";

import { getProfessionalPublicMediaBySlug } from "@/services/professionalMediaService";

export const Route = createFileRoute("/profissional/$slug")({
  loader: async ({ params }) => {
    const mock = professionals.find((p) => p.slug === params.slug);
    if (mock) return { pro: mock };
    const db = await getProfessionalBySlug(params.slug).catch(() => undefined);
    if (!db) throw notFound();
    return { pro: db };
  },

  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.pro.name} — ${loaderData.pro.specialty}` },
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

function ratingDistribution(reviews: PublicReview[]) {
  const dist = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    dist[Math.round(r.rating) - 1] += 1;
  });
  return dist;
}

function ProfilePage() {
  const { pro } = Route.useLoaderData();

  const { data: reviews, isLoading: loadingReviews } = useQuery({
    queryKey: ["reviews-db", pro.slug],
    queryFn: () => listApprovedReviewsBySlug(pro.slug),
  });
  const { data: hours } = useQuery({
    queryKey: ["pro-hours", pro.id],
    queryFn: () => getPublicBusinessHours(pro.id),
    enabled: Boolean(pro.id),
  });
  const showHours = hasAnyHours(hours);

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

  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [liveViews, setLiveViews] = useState<number | null>(
    typeof pro.viewsTotal === "number" ? pro.viewsTotal : null,
  );
  const trackedRef = useRef(false);
  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    const t = window.setTimeout(() => {
      registerProfileView(pro.slug)
        .then((r) => {
          if (r) setLiveViews(r.public_total);
        })
        .catch(() => undefined);
    }, 1500);
    return () => window.clearTimeout(t);
  }, [pro.slug]);

  const displayViews = liveViews ?? pro.viewsTotal ?? 0;

  const waNumber = normalizeWhatsAppPhone(pro.whatsapp);
  const waUrl = buildWhatsAppUrl(pro.whatsapp);
  const phoneFormatted = formatBrazilPhone(pro.whatsapp);
  const hasContact = Boolean(waNumber);

  const handleWhatsApp = () => {
    if (!waUrl) {
      toast.info("Este profissional ainda não disponibilizou contato pelo WhatsApp.");
      return;
    }
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleRevealPhone = async () => {
    if (!phoneFormatted) {
      toast.info("Este profissional não disponibilizou o telefone publicamente.");
      return;
    }
    setPhoneRevealed(true);
  };

  const copyPhone = async () => {
    if (!phoneFormatted) return;
    try {
      await navigator.clipboard.writeText(phoneFormatted);
      toast.success("Telefone copiado.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const contactCard = (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Serviços a partir de
      </p>
      <p className="mt-1 font-display text-3xl font-extrabold text-foreground">
        {pro.priceFrom > 0 ? `R$ ${pro.priceFrom}` : "Sob consulta"}
      </p>
      {pro.responseTime && pro.responseTime !== "—" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock size={15} className="text-success" aria-hidden="true" />
          Responde em até {pro.responseTime}
        </div>
      )}
      <div className="mt-5 space-y-3">
        <Button asChild className="h-12 w-full rounded-xl bg-orange font-semibold text-orange-foreground hover:bg-orange/90">
          <Link to="/pedir-orcamento" search={{ profissional: pro.slug } as never}>
            Pedir orçamento grátis
          </Link>
        </Button>
        <Button
          onClick={handleWhatsApp}
          disabled={!hasContact}
          variant="outline"
          className="h-12 w-full rounded-xl border-success/40 font-semibold text-success hover:bg-success/10 hover:text-success disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={hasContact ? `Chamar ${pro.name} no WhatsApp` : "WhatsApp indisponível"}
        >
          <MessageCircle size={17} aria-hidden="true" />
          {hasContact ? "Chamar no WhatsApp" : "WhatsApp indisponível"}
        </Button>
        {phoneRevealed && phoneFormatted ? (
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              className="h-11 flex-1 rounded-xl font-semibold text-foreground"
            >
              <a href={`tel:+${waNumber}`} aria-label={`Ligar para ${phoneFormatted}`}>
                <Phone size={16} aria-hidden="true" />
                {phoneFormatted}
              </a>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={copyPhone}
              className="h-11 rounded-xl px-3 text-muted-foreground"
              aria-label="Copiar telefone"
            >
              <Copy size={16} aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleRevealPhone}
            disabled={!phoneFormatted}
            variant="ghost"
            className="h-11 w-full rounded-xl font-semibold text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Phone size={16} aria-hidden="true" />
            {phoneFormatted ? "Ver telefone" : "Telefone não disponível"}
          </Button>
        )}
      </div>
      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
        Grátis e sem compromisso. Seus dados só são compartilhados quando você decide.
      </p>
    </div>
  );

  return (
    <SiteLayout>
      {/* ============== HERO PREMIUM ============== */}
      <section className="relative w-full bg-gradient-to-b from-muted/40 to-background">
        <div className="container-page pt-4 sm:pt-6">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Início</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link to="/categoria/$slug" params={{ slug: pro.categorySlug }} className="hover:text-foreground">
              {pro.specialty}
            </Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-foreground">{pro.name}</span>
          </nav>

          {/* Banner: imagem 100% visível e completa dentro do container */}
          <div className="relative overflow-hidden rounded-3xl bg-black shadow-sm ring-1 ring-border">
            {dbMedia?.coverUrl ? (
              <>
                <img
                  src={dbMedia.coverUrl}
                  alt={`Capa de ${pro.name}`}
                  className="h-auto w-full object-contain"
                  loading="eager"
                />
                {/* Gradiente sutil na base para suavizar a transição com o card */}
                <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 to-transparent" />
              </>
            ) : (
              <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-muted to-accent/10 sm:h-56 lg:h-64">
                <div className="text-center text-muted-foreground/60">
                  <ImageIcon size={40} className="mx-auto" />
                  <p className="mt-2 text-sm">Sem capa cadastrada</p>
                </div>
              </div>
            )}

            {/* Ações flutuantes no canto do banner */}
            <div className="absolute right-3 top-3 flex items-center gap-2 sm:right-4 sm:top-4">
              <FavoriteButton slug={pro.slug} name={pro.name} className="rounded-full bg-white/90 shadow-md backdrop-blur hover:bg-white" />
            </div>

            {/* Badges no canto inferior direito */}
            <div className="absolute bottom-3 right-3 flex flex-wrap items-center justify-end gap-1.5 sm:bottom-4 sm:right-4">
              {pro.verified && (
                <Badge className="gap-1 rounded-full bg-white/95 text-success shadow-sm backdrop-blur hover:bg-white">
                  <BadgeCheck size={13} aria-hidden="true" /> Verificado
                </Badge>
              )}
              {pro.emergency && (
                <Badge className="gap-1 rounded-full bg-orange text-white shadow-sm hover:bg-orange">
                  <Zap size={13} aria-hidden="true" /> Emergência 24h
                </Badge>
              )}
            </div>
          </div>

          {/* Card do profissional — mobile: coluna centralizada; desktop: grid com avatar + info + CTA */}
          <div className="relative z-10 -mt-10 sm:-mt-14 lg:-mt-16">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-xl shadow-black/[0.04] sm:p-7">
              <div className="flex flex-col items-center text-center sm:grid sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start sm:gap-6 sm:text-left lg:items-center">
                {/* Avatar com ring branco premium */}
                <div className="shrink-0">
                  <div className="rounded-full bg-card p-1.5 shadow-lg ring-1 ring-border sm:p-2">
                    <ProAvatar
                      initials={pro.initials}
                      color={pro.avatarColor}
                      size="xl"
                      imageUrl={dbMedia?.avatarUrl || undefined}
                      alt={pro.name}
                    />
                  </div>
                </div>

                {/* Identidade */}
                <div className="mt-4 min-w-0 sm:mt-0">
                  <h1 className="font-display text-2xl font-extrabold leading-tight text-foreground sm:text-3xl lg:text-[2rem]">
                    {pro.name}
                  </h1>
                  <p className="mt-1 text-sm font-medium text-muted-foreground sm:text-base">
                    {pro.specialty}
                    {pro.company ? ` · ${pro.company}` : ""}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground sm:justify-start">
                    <div className="flex items-center gap-1.5">
                      <RatingStars rating={pro.rating} />
                      <span className="tabular-nums">({pro.reviewsCount})</span>
                    </div>
                    {(() => {
                      const a = pro.address;
                      const label = a?.locationLabel?.trim()
                        ? a.locationLabel.trim()
                        : a
                        ? publicAddressLabel({
                            visibility: a.visibility,
                            city: a.city,
                            state: a.state,
                            neighborhood: a.neighborhood,
                            street: a.street,
                            address_number: a.number,
                            address_complement: a.complement,
                            postal_code: a.postalCode,
                            formatted_address: a.formatted,
                          })
                        : `${pro.city}, ${pro.state}`;
                      return label ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={14} aria-hidden="true" />
                          {label}
                        </span>
                      ) : null;
                    })()}
                    {showHours && hours && <OpenNowBadge week={hours} />}
                    {pro.experienceYears > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Award size={14} aria-hidden="true" />
                        {pro.experienceYears} anos de experiência
                      </span>
                    )}
                    {displayViews > 0 && (
                      <span
                        className="inline-flex items-center gap-1"
                        title={`${formatProfileViews(displayViews)} visitas ao perfil`}
                      >
                        <Eye size={14} aria-hidden="true" />
                        <span className="tabular-nums">{formatViewsLabel(displayViews)}</span>
                      </span>
                    )}
                  </div>

                  {(pro.social?.instagramUrl || pro.social?.facebook || pro.social?.website) && (
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      {pro.social?.instagramUrl && (
                        <a
                          href={normalizeExternalUrl(pro.social.instagramUrl, "instagram") ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                        >
                          <Instagram size={13} />@{pro.social.instagram}
                        </a>
                      )}
                      {pro.social?.facebook && (
                        <a
                          href={normalizeExternalUrl(pro.social.facebook, "facebook") ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                        >
                          <Facebook size={13} /> Facebook
                        </a>
                      )}
                      {pro.social?.website && (
                        <a
                          href={normalizeExternalUrl(pro.social.website) ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                        >
                          <Globe size={13} /> Website
                        </a>
                      )}

                    </div>
                  )}
                </div>

                {/* CTA rápido — escondido no mobile (sticky bottom já existe) */}
                <div className="hidden lg:flex lg:flex-col lg:items-end">
                  <Button
                    className="h-11 bg-orange px-6 text-white shadow-md hover:bg-orange/90"
                    onClick={() => {
                      const el = document.getElementById("form-orcamento");
                      el?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    Pedir orçamento
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>





      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-12">
          <section aria-label="Portfólio">

            {(dbMedia?.portfolio.length ?? 0) > 0 ? (
              <PublicPortfolioGrid items={dbMedia!.portfolio} />
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {pro.portfolio.map((item: string) => (
                  <figure key={item} className="overflow-hidden rounded-2xl border border-border bg-card">
                    <div className="flex aspect-video items-center justify-center bg-secondary text-primary/40">
                      <ImageIcon size={32} aria-hidden="true" />
                    </div>
                    <figcaption className="px-4 py-3 text-sm font-medium text-foreground">{item}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>

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
              {pro.services.map((s: { id?: string; name: string; priceFrom: number }) => (
                <li key={s.id ?? s.name} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <span className="text-sm font-medium text-foreground">{s.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 text-sm font-bold text-primary">
                      {s.priceFrom > 0 ? `a partir de R$ ${s.priceFrom}` : "Sob consulta"}
                    </span>
                    {s.id && (
                      <Link
                        to="/pedir-orcamento"
                        search={{ profissional: pro.slug, servico: s.id } as never}
                        className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        Solicitar
                      </Link>
                    )}
                  </div>
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
                {pro.regions.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {pro.regions.map((r: string) => (
                      <span key={r} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                        {r}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Não informado</p>
                )}
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarClock size={15} className="text-primary" aria-hidden="true" /> Horários
                </p>
                {showHours && hours ? (
                  <ul className="mt-3 space-y-1">
                    {hours.map((d) => (
                      <li key={d.weekday} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">{WEEKDAY_SHORT[d.weekday]}</span>
                        <span className={d.is_closed ? "text-muted-foreground" : "font-semibold text-foreground"}>
                          {dayLabel(d)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Horário não informado</p>
                )}
                {pro.holidayNote && (
                  <p className="mt-2 text-xs text-muted-foreground">{pro.holidayNote}</p>
                )}
              </div>
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
            ) : !reviews || reviews.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Este profissional ainda não recebeu avaliações.
              </p>
            ) : (
              <ul className="mt-5 space-y-4">
                {reviews.map((review: PublicReview) => (
                  <li key={review.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">Cliente verificado</p>
                      <RatingStars rating={review.rating} showValue={false} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                    {review.comment && (
                      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                    )}
                    {review.reply && (
                      <div className="mt-3 rounded-xl bg-secondary/60 p-3 text-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Resposta do profissional</p>
                        <p className="mt-1 text-muted-foreground">{review.reply}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {pro.address && pro.address.visibility !== "hidden" && (
            <section aria-labelledby="localizacao">
              <h2 id="localizacao" className="font-display text-xl font-bold text-foreground">
                Localização
              </h2>
              <div className="mt-4 space-y-3">
                <LocationMap
                  latitude={pro.address.latitude}
                  longitude={pro.address.longitude}
                  radiusKm={pro.address.serviceRadiusKm}
                  height={280}
                  query={publicAddressLabel({
                    visibility: pro.address.visibility,
                    city: pro.address.city,
                    state: pro.address.state,
                    neighborhood: pro.address.neighborhood,
                    street: pro.address.street,
                    address_number: pro.address.number,
                    postal_code: pro.address.postalCode,
                    formatted_address: pro.address.formatted,
                  })}
                />

                {(() => {
                  const a = pro.address!;
                  const url = mapsSearchUrl({
                    visibility: a.visibility,
                    city: a.city,
                    state: a.state,
                    neighborhood: a.neighborhood,
                    street: a.street,
                    address_number: a.number,
                    postal_code: a.postalCode,
                    formatted_address: a.formatted,
                  });
                  const label = publicAddressLabel({
                    visibility: a.visibility,
                    city: a.city,
                    state: a.state,
                    neighborhood: a.neighborhood,
                    street: a.street,
                    address_number: a.number,
                    address_complement: a.complement,
                    postal_code: a.postalCode,
                    formatted_address: a.formatted,
                  });
                  return (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
                      <span className="inline-flex flex-col gap-1 text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <MapPin size={15} className="text-primary" />
                          {label}
                          {a.serviceRadiusKm ? ` · Raio de ${a.serviceRadiusKm} km` : ""}
                        </span>
                        {a.visibility === "full_address" && a.reference && (
                          <span className="pl-6 text-xs">Referência: {a.reference}</span>
                        )}
                      </span>
                      {url && (
                        <Button asChild size="sm" variant="outline">
                          <a href={url} target="_blank" rel="noreferrer">Abrir no Google Maps</a>
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </div>
            </section>
          )}

          {showHours && hours && (
            <BusinessHoursCard week={hours} holidayNote={pro.holidayNote} />
          )}




          {reviews && reviews.length > 0 && (
            <section aria-labelledby="historico">
              <h2 id="historico" className="font-display text-xl font-bold text-foreground">
                Histórico recente
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Últimas atividades e avaliações registradas na plataforma.
              </p>
              <ol className="mt-5 space-y-4 border-l-2 border-border pl-5">
                {reviews.slice(0, 8).map((r: PublicReview) => (
                  <li key={`t-${r.id}`} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-card"
                    />
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {new Date(r.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      Nova avaliação {r.rating}★ recebida
                    </p>
                    {r.comment && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">"{r.comment}"</p>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

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

        <aside id="form-orcamento" className="order-first lg:order-none scroll-mt-24">
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
