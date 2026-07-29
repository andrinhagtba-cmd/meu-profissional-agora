import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { uploadAdminMedia } from "@/services/adminMediaService";
import { updateProProfile } from "@/services/adminService";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Copy,
  ExternalLink,
  Eye,
  FileCheck2,
  GalleryHorizontalEnd,
  MapPin,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  WalletCards,
  X,
} from "lucide-react";

import { InitialsAvatar, StatusPill } from "@/components/admin/AdminTable";
import { AdminProProfileEditor } from "@/components/admin/AdminProProfileEditor";
import { AdminProServicesPanel } from "@/components/admin/AdminProServicesPanel";
import { AdminProPortfolioPanel } from "@/components/admin/AdminProPortfolioPanel";
import { AdminProDocumentsPanel } from "@/components/admin/AdminProDocumentsPanel";
import { AdminProReviewsPanel } from "@/components/admin/AdminProReviewsPanel";
import { AdminProActivityPanel } from "@/components/admin/AdminProActivityPanel";
import { AdminProPlanAccessPanel } from "@/components/admin/AdminProPlanAccessPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getProDetail,
  setProVerification,
  setProFeatured,
  setProProfileStatus,
} from "@/services/adminService";

const VERIF_LABEL: Record<string, string> = {
  pending: "Em análise",
  approved: "Verificado",
  rejected: "Rejeitado",
};
const PROFILE_LABEL: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Suspenso",
};

type AdminProSearch = { tab: string };

export const Route = createFileRoute("/_authenticated/admin/profissionais/$id")({
  head: () => ({ meta: [{ title: "Profissional · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  validateSearch: (raw: Record<string, unknown>): AdminProSearch => ({
    tab: typeof raw.tab === "string" ? raw.tab : "overview",
  }),
  component: AdminProDetailPage,
});

function AdminProDetailPage() {
  const { id } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const router = useRouter();
  const qc = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);

  const { data: pro, isLoading, error } = useQuery({
    queryKey: ["admin-pro-detail", id],
    queryFn: () => getProDetail(id),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-pro-detail", id] });
    qc.invalidateQueries({ queryKey: ["admin-pros"] });
  };

  const verify = useMutation({
    mutationFn: (s: "approved" | "rejected" | "pending") => setProVerification(id, s),
    onSuccess: () => { toast.success("Status de verificação atualizado"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const feat = useMutation({
    mutationFn: (f: boolean) => setProFeatured(id, f),
    onSuccess: () => { toast.success("Destaque atualizado"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const status = useMutation({
    mutationFn: (s: "published" | "archived" | "draft") => setProProfileStatus(id, s),
    onSuccess: () => { toast.success("Situação atualizada"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56 rounded-full" />
        <Skeleton className="h-72 w-full rounded-[2rem]" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr),340px]">
          <Skeleton className="h-[560px] rounded-[2rem]" />
          <Skeleton className="h-[560px] rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (error || !pro) {
    return (
      <div className="rounded-[2rem] border bg-card p-10 text-center shadow-card">
        <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? "Profissional não encontrado."}</p>
        <Button asChild variant="outline" className="mt-4 rounded-full">
          <Link to="/admin/profissionais">Voltar para profissionais</Link>
        </Button>
      </div>
    );
  }

  const displayName = pro.professional_name || pro.business_name || pro.profile_full_name || "Profissional sem nome";
  const isArchived = pro.profile_status === "archived";
  const publicPath = pro.slug ? `/profissional/${pro.slug}` : null;

  const copyPublicLink = () => {
    if (!publicPath || typeof window === "undefined") return;
    window.navigator.clipboard.writeText(`${window.location.origin}${publicPath}`);
    toast.success("Link público copiado");
  };


  const handleMediaUpload = async (
    kind: "avatar" | "cover",
    file: File | null | undefined,
  ) => {
    if (!file) return;
    try {
      setUploading(kind);
      const { mediaId } = await uploadAdminMedia(file, "banner");
      await updateProProfile(id, kind === "avatar" ? { avatar_media_id: mediaId } : { cover_media_id: mediaId });
      toast.success(kind === "avatar" ? "Avatar atualizado" : "Capa atualizada");
      invalidate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handleMediaUpload("avatar", e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handleMediaUpload("cover", e.target.files?.[0]); e.target.value = ""; }} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/profissionais" className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground shadow-card hover:text-primary">
          <ArrowLeft size={15} /> Voltar para profissionais
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {publicPath && (
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <a href={publicPath} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Perfil público</a>
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => router.invalidate()}>
            <RefreshCw size={14} /> Atualizar
          </Button>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card shadow-float">
        {/* Capa limpa: sem texto, gradiente sutil apenas para profundidade */}
        <div className="relative h-52 w-full overflow-hidden sm:h-60">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-[1.02]"
            style={pro.cover_url ? { backgroundImage: `url(${pro.cover_url})` } : undefined}
          />
          {!pro.cover_url && (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_92%,white),color-mix(in_oklab,var(--primary)_52%,var(--orange)))]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploading === "cover"}
            className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-70"
          >
            {uploading === "cover" ? <Loader2 size={13} className="animate-spin text-primary" /> : <ImagePlus size={13} className="text-primary" />}
            {pro.cover_url ? "Alterar capa" : "Adicionar capa"}
          </button>
        </div>

        {/* Card de perfil premium abaixo da capa, sem sobrepor a imagem */}
        <div className="relative px-5 pb-6 sm:px-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="group relative -mt-14 h-28 w-28 shrink-0 sm:-mt-16 sm:h-32 sm:w-32">
                <div className="h-28 w-28 rounded-full border-4 border-card bg-card p-1 shadow-float sm:h-32 sm:w-32">
                  {pro.avatar_url ? (
                    <img src={pro.avatar_url} alt={displayName} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <InitialsAvatar name={displayName} className="h-full w-full rounded-full text-3xl" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading === "avatar"}
                  aria-label={pro.avatar_url ? "Alterar avatar" : "Adicionar avatar"}
                  className="absolute bottom-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-primary text-white shadow-float transition hover:bg-primary/90 disabled:opacity-70"
                >
                  {uploading === "avatar" ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                </button>
              </div>
              <div className="pt-1 sm:pt-3">
                <div className="mb-2.5 flex flex-wrap items-center gap-2">
                  <StatusPill tone={pro.verification_status === "approved" ? "success" : pro.verification_status === "rejected" ? "danger" : "warning"}>
                    {VERIF_LABEL[pro.verification_status] ?? pro.verification_status}
                  </StatusPill>
                  <StatusPill tone={pro.profile_status === "published" ? "success" : pro.profile_status === "archived" ? "danger" : "warning"}>
                    {PROFILE_LABEL[pro.profile_status] ?? pro.profile_status}
                  </StatusPill>
                  {pro.is_featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange/10 px-2.5 py-1 text-[11px] font-bold text-orange">
                      <Star size={12} className="fill-orange" /> Destaque
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-extrabold tracking-normal text-foreground sm:text-3xl">{displayName}</h1>
                  {pro.verification_status === "approved" && <BadgeCheck size={22} className="text-primary" />}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  {pro.business_name && pro.business_name !== pro.professional_name && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1">
                      <Building2 size={14} /> {pro.business_name}
                    </span>
                  )}
                  {pro.city && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1">
                      <MapPin size={14} /> {pro.city}/{pro.state}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1">
                    <CalendarDays size={14} /> {new Date(pro.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 lg:pt-3">
              {publicPath && (
                <Button variant="outline" className="rounded-full bg-card" onClick={copyPublicLink}>
                  <Copy size={15} /> Copiar link
                </Button>
              )}
              <Button className="rounded-full shadow-float" onClick={() => navigate({ search: (prev: AdminProSearch) => ({ ...prev, tab: "profile" }), resetScroll: false })}>
                <Pencil size={15} /> Editar perfil
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full bg-card"><MoreHorizontal size={16} /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>Ações administrativas</DropdownMenuLabel>
                  {pro.verification_status !== "approved" && <DropdownMenuItem onClick={() => verify.mutate("approved")}><BadgeCheck size={14} className="mr-2 text-primary" /> Aprovar verificação</DropdownMenuItem>}
                  {pro.verification_status !== "rejected" && <DropdownMenuItem onClick={() => verify.mutate("rejected")}><X size={14} className="mr-2" /> Rejeitar verificação</DropdownMenuItem>}
                  {pro.verification_status !== "pending" && <DropdownMenuItem onClick={() => verify.mutate("pending")}><RefreshCw size={14} className="mr-2" /> Voltar para análise</DropdownMenuItem>}
                  <DropdownMenuItem onClick={() => feat.mutate(!pro.is_featured)}><Star size={14} className={`mr-2 ${pro.is_featured ? "fill-orange text-orange" : ""}`} />{pro.is_featured ? "Remover destaque" : "Destacar"}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {!isArchived ? (
                    <DropdownMenuItem onClick={() => status.mutate("archived")} className="text-destructive focus:text-destructive"><PauseCircle size={14} className="mr-2" /> Suspender perfil</DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => status.mutate("published")}><PlayCircle size={14} className="mr-2 text-primary" /> Reativar perfil</DropdownMenuItem>
                  )}
                  {publicPath && <DropdownMenuItem asChild><a href={publicPath} target="_blank" rel="noreferrer"><Eye size={14} className="mr-2" /> Pré-visualizar público</a></DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* KPIs premium */}
          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KPI icon={<BriefcaseBusiness size={18} />} label="Serviços" value={pro.counts.services} hint="ofertas vinculadas" />
            <KPI icon={<GalleryHorizontalEnd size={18} />} label="Portfólio" value={pro.counts.portfolio} hint="provas visuais" />
            <KPI icon={<Sparkles size={18} />} label="Leads" value={pro.counts.leads} hint="oportunidades" />
            <KPI icon={<Star size={18} />} label="Avaliações" value={pro.counts.reviews} hint={`★ ${pro.average_rating ? Number(pro.average_rating).toFixed(1) : "—"}`} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),360px]">
        <Tabs value={tab} onValueChange={(v) => navigate({ search: (prev: AdminProSearch) => ({ ...prev, tab: v }), resetScroll: false })}>
          <div className="overflow-hidden rounded-[1.7rem] border bg-card p-2 shadow-card">
            <TabsList className="flex h-auto w-full justify-start gap-2 overflow-x-auto rounded-[1.25rem] bg-background p-2">
              <Tab value="overview" icon={<Eye size={15} />} label="Visão geral" />
              <Tab value="profile" icon={<Pencil size={15} />} label="Perfil" />
              <Tab value="services" icon={<BriefcaseBusiness size={15} />} label="Serviços" />
              <Tab value="portfolio" icon={<GalleryHorizontalEnd size={15} />} label="Portfólio" />
              <Tab value="documents" icon={<FileCheck2 size={15} />} label="Documentos" />
              <Tab value="reviews" icon={<Star size={15} />} label="Avaliações" />
              <Tab value="plan" icon={<WalletCards size={15} />} label="Plano e acesso" />
              <Tab value="activity" icon={<Timer size={15} />} label="Histórico" />
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-5 space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="rounded-[1.7rem] shadow-card">
                <CardHeader><CardTitle className="font-display text-xl font-extrabold tracking-normal">Contato e presença</CardTitle></CardHeader>
                <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                  <Field label="E-mail da conta" value={pro.profile_email} />
                  <Field label="Nome na conta" value={pro.profile_full_name} />
                  <Field label="WhatsApp" value={pro.whatsapp} />
                  <Field label="Localização" value={pro.city ? `${pro.city}/${pro.state}` : null} />
                  <Field label="Tempo de resposta" value={pro.response_time} />
                  <Field label="Anos de experiência" value={pro.years_experience?.toString() ?? null} />
                  <Field label="Preço inicial" value={pro.starting_price != null ? `R$ ${Number(pro.starting_price).toFixed(2)}` : null} />
                  <Field label="Disponibilidade" value={pro.availability_status} />
                </CardContent>
              </Card>
              <Card className="rounded-[1.7rem] shadow-card">
                <CardHeader><CardTitle className="font-display text-xl font-extrabold tracking-normal">Qualidade operacional</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <QualityRow label="Perfil público" value={pro.profile_status === "published" ? 100 : pro.profile_status === "draft" ? 45 : 15} />
                  <QualityRow label="Verificação" value={pro.verification_status === "approved" ? 100 : pro.verification_status === "pending" ? 55 : 20} />
                  <QualityRow label="Reputação" value={Math.min(100, Number(pro.average_rating ?? 0) * 20)} />
                  <QualityRow label="Conteúdo" value={Math.min(100, (pro.counts.services * 18) + (pro.counts.portfolio * 12) + (pro.description ? 25 : 0))} />
                </CardContent>
              </Card>
            </div>
            <Card className="rounded-[1.7rem] shadow-card">
              <CardHeader><CardTitle className="font-display text-xl font-extrabold tracking-normal">Apresentação pública</CardTitle></CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {pro.description || "Sem descrição cadastrada."}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="mt-5"><AdminProProfileEditor pro={pro} /></TabsContent>
          <TabsContent value="services" className="mt-5"><AdminProServicesPanel professionalId={pro.id} /></TabsContent>
          <TabsContent value="portfolio" className="mt-5"><AdminProPortfolioPanel professionalId={pro.id} professionalUserId={pro.user_id} /></TabsContent>
          <TabsContent value="documents" className="mt-5"><AdminProDocumentsPanel professionalId={pro.id} professionalUserId={pro.user_id} /></TabsContent>
          <TabsContent value="reviews" className="mt-5"><AdminProReviewsPanel professionalId={pro.id} /></TabsContent>
          <TabsContent value="plan" className="mt-5">
            <AdminProPlanAccessPanel
              professionalId={pro.id}
              userId={pro.user_id ?? null}
              accountEmail={pro.profile_email}
              displayName={displayName}
            />
          </TabsContent>
          <TabsContent value="activity" className="mt-5"><AdminProActivityPanel professionalId={pro.id} /></TabsContent>
        </Tabs>

        <aside className="space-y-5">
          <Card className="sticky top-24 overflow-hidden rounded-[1.7rem] shadow-card">
            <CardHeader className="border-b bg-background/70 pb-4">
              <CardTitle className="flex items-center gap-2 font-display text-lg font-extrabold tracking-normal"><ShieldCheck size={18} className="text-primary" /> Comando rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <SideRow label="Verificação"><StatusPill tone={pro.verification_status === "approved" ? "success" : pro.verification_status === "rejected" ? "danger" : "warning"}>{VERIF_LABEL[pro.verification_status] ?? pro.verification_status}</StatusPill></SideRow>
              <SideRow label="Perfil"><StatusPill tone={pro.profile_status === "published" ? "success" : pro.profile_status === "archived" ? "danger" : "warning"}>{PROFILE_LABEL[pro.profile_status] ?? pro.profile_status}</StatusPill></SideRow>
              <SideRow label="Destaque"><StatusPill tone={pro.is_featured ? "success" : "neutral"}>{pro.is_featured ? "Ativo" : "Não"}</StatusPill></SideRow>
              <SideRow label="Emergência"><StatusPill tone={pro.emergency ? "success" : "neutral"}>{pro.emergency ? "Aceita" : "Não"}</StatusPill></SideRow>
              <SideRow label="Origem"><span className="text-xs text-muted-foreground">{pro.source ?? "—"}</span></SideRow>
              <SideRow label="Atualizado"><span className="text-xs text-muted-foreground">{new Date(pro.updated_at).toLocaleString("pt-BR")}</span></SideRow>

              <div className="space-y-2 border-t pt-4">
                {pro.verification_status !== "approved" && <Button className="w-full rounded-full" onClick={() => verify.mutate("approved")} disabled={verify.isPending}><BadgeCheck size={14} /> Aprovar verificação</Button>}
                <Button className="w-full rounded-full" variant="outline" onClick={() => feat.mutate(!pro.is_featured)} disabled={feat.isPending}><Star size={14} className={pro.is_featured ? "fill-orange text-orange" : ""} />{pro.is_featured ? "Remover destaque" : "Destacar"}</Button>
                {!isArchived ? (
                  <Button className="w-full rounded-full" variant="outline" onClick={() => status.mutate("archived")} disabled={status.isPending}><PauseCircle size={14} /> Suspender perfil</Button>
                ) : (
                  <Button className="w-full rounded-full" variant="outline" onClick={() => status.mutate("published")} disabled={status.isPending}><PlayCircle size={14} /> Reativar perfil</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Tab({ value, icon, label }: { value: string; icon: ReactNode; label: string }) {
  return <TabsTrigger value={value} className="h-10 rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-card">{icon}{label}</TabsTrigger>;
}

function KPI({ icon, label, value, hint }: { icon: ReactNode; label: string; value: number; hint: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card to-background p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-float">
      <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 translate-y-[-40%] rounded-full bg-primary/5 blur-2xl transition group-hover:bg-primary/10" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary shadow-sm">{icon}</div>
        <div className="text-right">
          <div className="font-display text-2xl font-extrabold tracking-normal text-foreground">{value}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        </div>
      </div>
      <div className="relative mt-3 border-t border-border/40 pt-2.5 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-2xl bg-background px-4 py-3">
      <div className="text-[11px] font-bold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 break-words font-semibold text-foreground">{value || "—"}</div>
    </div>
  );
}

function QualityRow({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-semibold">{label}</span><span className="text-muted-foreground">{pct}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function SideRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-muted-foreground">{label}</span>{children}</div>;
}