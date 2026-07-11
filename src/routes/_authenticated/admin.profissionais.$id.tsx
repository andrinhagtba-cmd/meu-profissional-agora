import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusPill, InitialsAvatar } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, BadgeCheck, Star, X, ExternalLink, MoreHorizontal, PauseCircle,
  PlayCircle, RefreshCw, Eye, Copy,
} from "lucide-react";
import {
  getProDetail, setProVerification, setProFeatured, setProProfileStatus,
} from "@/services/adminService";
import { AdminProProfileEditor } from "@/components/admin/AdminProProfileEditor";
import { AdminProServicesPanel } from "@/components/admin/AdminProServicesPanel";
import { AdminProPortfolioPanel } from "@/components/admin/AdminProPortfolioPanel";
import { AdminProDocumentsPanel } from "@/components/admin/AdminProDocumentsPanel";
import { AdminProReviewsPanel } from "@/components/admin/AdminProReviewsPanel";
import { AdminProActivityPanel } from "@/components/admin/AdminProActivityPanel";

const VERIF_LABEL: Record<string, string> = {
  pending: "Aguardando análise", approved: "Verificado", rejected: "Rejeitado",
};
const PROFILE_LABEL: Record<string, string> = {
  draft: "Rascunho", published: "Publicado", archived: "Suspenso",
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
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !pro) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? "Profissional não encontrado."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/_authenticated/admin/profissionais">Voltar para a lista</Link>
        </Button>
      </div>
    );
  }

  const displayName = pro.professional_name || pro.business_name || pro.profile_full_name || "Profissional sem nome";
  const isArchived = pro.profile_status === "archived";
  const publicUrl = pro.slug ? `${window.location.origin}/profissional/${pro.slug}` : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/_authenticated/admin/profissionais" className="inline-flex items-center gap-1.5 hover:text-foreground">
          <ArrowLeft size={14} /> Profissionais
        </Link>
        <span>/</span>
        <span className="truncate text-foreground">{displayName}</span>
      </div>

      {/* Cabeçalho */}
      <Card className="overflow-hidden border-border/60">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <InitialsAvatar name={displayName} className="h-14 w-14 text-lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
                {pro.verification_status === "approved" && <BadgeCheck size={18} className="text-primary" />}
                {pro.is_featured && <Star size={16} className="fill-orange text-orange" />}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {pro.business_name && pro.professional_name !== pro.business_name && (
                  <span>{pro.business_name}</span>
                )}
                {pro.city && <span>{pro.city}/{pro.state}</span>}
                <span>Cadastrado em {new Date(pro.created_at).toLocaleDateString("pt-BR")}</span>
                {pro.slug && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted"
                    onClick={() => { if (publicUrl) { navigator.clipboard.writeText(publicUrl); toast.success("Link copiado"); } }}
                  >
                    <Copy size={11} /> {pro.slug}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {publicUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} className="mr-1.5" /> Perfil público
                </a>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><MoreHorizontal size={14} /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                {pro.verification_status !== "approved" && (
                  <DropdownMenuItem onClick={() => verify.mutate("approved")}>
                    <BadgeCheck size={14} className="mr-2 text-primary" /> Aprovar verificação
                  </DropdownMenuItem>
                )}
                {pro.verification_status !== "rejected" && (
                  <DropdownMenuItem onClick={() => verify.mutate("rejected")}>
                    <X size={14} className="mr-2" /> Rejeitar verificação
                  </DropdownMenuItem>
                )}
                {pro.verification_status !== "pending" && (
                  <DropdownMenuItem onClick={() => verify.mutate("pending")}>
                    <RefreshCw size={14} className="mr-2" /> Voltar para análise
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => feat.mutate(!pro.is_featured)}>
                  <Star size={14} className={`mr-2 ${pro.is_featured ? "fill-orange text-orange" : ""}`} />
                  {pro.is_featured ? "Remover destaque" : "Destacar"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!isArchived ? (
                  <DropdownMenuItem onClick={() => status.mutate("archived")} className="text-destructive focus:text-destructive">
                    <PauseCircle size={14} className="mr-2" /> Suspender perfil
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => status.mutate("published")}>
                    <PlayCircle size={14} className="mr-2 text-primary" /> Reativar perfil
                  </DropdownMenuItem>
                )}
                {publicUrl && (
                  <DropdownMenuItem asChild>
                    <a href={publicUrl} target="_blank" rel="noreferrer">
                      <Eye size={14} className="mr-2" /> Pré-visualizar público
                    </a>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        {/* Conteúdo com abas */}
        <div>
          <Tabs
            value={tab}
            onValueChange={(v) => navigate({ search: (prev: AdminProSearch) => ({ ...prev, tab: v }), resetScroll: false })}
          >
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Visão geral</TabsTrigger>
              <TabsTrigger value="profile">Perfil público</TabsTrigger>
              <TabsTrigger value="services">Serviços</TabsTrigger>
              <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="reviews">Avaliações</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KPI label="Serviços" value={pro.counts.services} />
                <KPI label="Portfólio" value={pro.counts.portfolio} />
                <KPI label="Leads" value={pro.counts.leads} />
                <KPI label="Avaliações" value={pro.counts.reviews} />
              </div>
              <Card>
                <CardHeader><CardTitle className="text-base">Contato e presença</CardTitle></CardHeader>
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
              <Card>
                <CardHeader><CardTitle className="text-base">Descrição</CardTitle></CardHeader>
                <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {pro.description || "Sem descrição cadastrada."}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="mt-4">
              <AdminProProfileEditor pro={pro} />
            </TabsContent>

            <TabsContent value="services" className="mt-4">
              <AdminProServicesPanel professionalId={pro.id} />
            </TabsContent>

            <TabsContent value="portfolio" className="mt-4">
              <AdminProPortfolioPanel professionalId={pro.id} professionalUserId={pro.user_id} />
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <AdminProDocumentsPanel professionalId={pro.id} professionalUserId={pro.user_id} />
            </TabsContent>

            {["reviews","activity"].map((k) => (
              <TabsContent key={k} value={k} className="mt-4">
                <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
                  Este bloco será liberado nos próximos entregáveis (Bloco E em diante).
                </CardContent></Card>
              </TabsContent>
            ))}

          </Tabs>
        </div>

        {/* Card lateral de status */}
        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Status</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Verificação">
                <StatusPill tone={pro.verification_status === "approved" ? "success" : pro.verification_status === "rejected" ? "danger" : "warning"}>
                  {VERIF_LABEL[pro.verification_status] ?? pro.verification_status}
                </StatusPill>
              </Row>
              <Row label="Perfil">
                <StatusPill tone={pro.profile_status === "published" ? "success" : pro.profile_status === "archived" ? "danger" : "warning"}>
                  {PROFILE_LABEL[pro.profile_status] ?? pro.profile_status}
                </StatusPill>
              </Row>
              <Row label="Destaque">
                <StatusPill tone={pro.is_featured ? "success" : "neutral"}>{pro.is_featured ? "Sim" : "Não"}</StatusPill>
              </Row>
              <Row label="Emergência">
                <StatusPill tone={pro.emergency ? "success" : "neutral"}>{pro.emergency ? "Aceita" : "Não"}</StatusPill>
              </Row>
              <Row label="Reputação">
                <span className="font-semibold">★ {pro.average_rating ? Number(pro.average_rating).toFixed(1) : "—"} <span className="text-xs text-muted-foreground">({pro.reviews_count ?? 0})</span></span>
              </Row>
              <Row label="Origem"><span className="text-xs text-muted-foreground">{pro.source ?? "—"}</span></Row>
              <Row label="Atualizado"><span className="text-xs text-muted-foreground">{new Date(pro.updated_at).toLocaleString("pt-BR")}</span></Row>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Ações rápidas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pro.verification_status !== "approved" && (
                <Button className="w-full" size="sm" onClick={() => verify.mutate("approved")} disabled={verify.isPending}>
                  <BadgeCheck size={14} className="mr-1.5" /> Aprovar verificação
                </Button>
              )}
              <Button className="w-full" size="sm" variant="outline" onClick={() => feat.mutate(!pro.is_featured)} disabled={feat.isPending}>
                <Star size={14} className={`mr-1.5 ${pro.is_featured ? "fill-orange text-orange" : ""}`} />
                {pro.is_featured ? "Remover destaque" : "Destacar"}
              </Button>
              {!isArchived ? (
                <Button className="w-full" size="sm" variant="outline" onClick={() => status.mutate("archived")} disabled={status.isPending}>
                  <PauseCircle size={14} className="mr-1.5" /> Suspender perfil
                </Button>
              ) : (
                <Button className="w-full" size="sm" variant="outline" onClick={() => status.mutate("published")} disabled={status.isPending}>
                  <PlayCircle size={14} className="mr-1.5" /> Reativar perfil
                </Button>
              )}
              <Button className="w-full" size="sm" variant="ghost" onClick={() => router.invalidate()}>
                <RefreshCw size={14} className="mr-1.5" /> Atualizar dados
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-foreground">{value || "—"}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
