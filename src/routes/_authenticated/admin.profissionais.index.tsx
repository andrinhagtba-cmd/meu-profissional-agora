import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  MapPin,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";

import { InitialsAvatar, StatusPill } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  listPros,
  setProFeatured,
  setProVerification,
  bulkVerifyPros,
  bulkFeaturePros,
  setProProfileStatus,
  type AdminProRow,
} from "@/services/adminService";

const VERIF_LABEL: Record<string, string> = {
  pending: "Em análise",
  approved: "Verificado",
  rejected: "Rejeitado",
};

const FILTERS = [
  { value: "", label: "Todos", icon: UsersRound },
  { value: "pending", label: "Pendentes", icon: Clock3 },
  { value: "approved", label: "Verificados", icon: ShieldCheck },
  { value: "rejected", label: "Rejeitados", icon: X },
  { value: "featured", label: "Destaques", icon: Sparkles },
];

export const Route = createFileRoute("/_authenticated/admin/profissionais")({
  head: () => ({ meta: [{ title: "Profissionais · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminPros,
});

function AdminPros() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const statusFilter = filter === "featured" ? undefined : filter || undefined;
  const featuredOnly = filter === "featured" ? true : undefined;

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-pros", filter, search],
    queryFn: () => listPros(statusFilter, search, featuredOnly),
  });

  const stats = useMemo(() => {
    const total = data.length;
    const approved = data.filter((p) => p.verification_status === "approved").length;
    const pending = data.filter((p) => p.verification_status === "pending").length;
    const featured = data.filter((p) => p.is_featured).length;
    const ratingBase = data.filter((p) => Number(p.average_rating) > 0);
    const avgRating = ratingBase.length
      ? ratingBase.reduce((acc, p) => acc + Number(p.average_rating ?? 0), 0) / ratingBase.length
      : 0;
    return { total, approved, pending, featured, avgRating };
  }, [data]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-pros"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
    qc.invalidateQueries({ queryKey: ["admin-verifications"] });
  };

  const verify = useMutation({
    mutationFn: (v: { id: string; s: "approved" | "rejected" | "pending" }) => setProVerification(v.id, v.s),
    onSuccess: () => { toast.success("Status atualizado"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const feat = useMutation({
    mutationFn: (v: { id: string; f: boolean }) => setProFeatured(v.id, v.f),
    onSuccess: () => { toast.success("Destaque atualizado"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const statusMut = useMutation({
    mutationFn: (v: { id: string; s: "published" | "archived" }) => setProProfileStatus(v.id, v.s),
    onSuccess: () => { toast.success("Situação atualizada"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const bulkV = useMutation({
    mutationFn: (v: { ids: string[]; s: "approved" | "rejected" }) => bulkVerifyPros(v.ids, v.s),
    onSuccess: () => { toast.success("Lote aplicado"); setSelected(new Set()); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const bulkF = useMutation({
    mutationFn: (v: { ids: string[]; f: boolean }) => bulkFeaturePros(v.ids, v.f),
    onSuccess: () => { toast.success("Destaques atualizados"); setSelected(new Set()); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openDetail = (id: string, tab = "overview") => {
    navigate({ to: "/admin/profissionais/$id", params: { id }, search: { tab } });
  };

  const toggle = (id: string) => setSelected((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const toggleAll = () => setSelected((s) => (data.every((p) => s.has(p.id)) ? new Set() : new Set(data.map((p) => p.id))));

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-5 shadow-float sm:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_30%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_45%),radial-gradient(circle_at_55%_70%,color-mix(in_oklab,var(--orange)_14%,transparent),transparent_35%)] lg:block" />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr),420px]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles size={14} /> Central operacional
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-display text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">
                  Gestão de profissionais
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Visualize, aprove, edite, destaque e acompanhe a qualidade da rede profissional sem sair do painel.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="rounded-full bg-card/80">
                  <Link to="/admin/relatorios">
                    Relatórios <ExternalLink size={15} />
                  </Link>
                </Button>
                <Button className="rounded-full shadow-float" onClick={() => navigate({ to: "/admin/profissionais/novo" })}>
                  <UserPlus size={16} /> Novo profissional
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={<UsersRound size={18} />} label="Base filtrada" value={stats.total.toString()} hint="profissionais" />
              <Metric icon={<CheckCircle2 size={18} />} label="Verificados" value={stats.approved.toString()} hint={`${stats.pending} pendentes`} />
              <Metric icon={<Star size={18} />} label="Destaques" value={stats.featured.toString()} hint="curadoria ativa" />
              <Metric icon={<BadgeCheck size={18} />} label="Nota média" value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"} hint="reviews aprovadas" />
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-border/70 bg-background/85 p-4 shadow-card backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-card">
                <BriefcaseBusiness size={20} />
              </div>
              <div>
                <div className="font-display text-lg font-extrabold tracking-normal">Fila de curadoria</div>
                <p className="text-xs text-muted-foreground">Priorize análise, destaque e qualidade pública.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <QueueRow label="Aguardando verificação" value={stats.pending} tone="warning" />
              <QueueRow label="Prontos para venda" value={stats.approved} tone="success" />
              <QueueRow label="Em destaque" value={stats.featured} tone="primary" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => {
              const Icon = item.icon;
              const active = filter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => { setFilter(item.value); setSelected(new Set()); }}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground shadow-card" : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"}`}
                >
                  <Icon size={15} /> {item.label}
                </button>
              );
            })}
          </div>
          <div className="relative min-w-0 xl:w-[360px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelected(new Set()); }}
              placeholder="Buscar por nome, empresa, cidade ou slug…"
              className="h-11 rounded-full border-border/80 bg-background pl-9 shadow-none"
            />
          </div>
        </div>

        {selected.size > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm">
            <BadgeCheck size={16} className="text-primary" />
            <span className="font-semibold">{selected.size} selecionado(s)</span>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button size="sm" className="rounded-full" onClick={() => bulkV.mutate({ ids: [...selected], s: "approved" })} disabled={bulkV.isPending}>Aprovar</Button>
              <Button size="sm" className="rounded-full" variant="outline" onClick={() => bulkV.mutate({ ids: [...selected], s: "rejected" })} disabled={bulkV.isPending}>Rejeitar</Button>
              <Button size="sm" className="rounded-full" variant="outline" onClick={() => bulkF.mutate({ ids: [...selected], f: true })} disabled={bulkF.isPending}>Destacar</Button>
              <Button size="sm" className="rounded-full" variant="ghost" onClick={() => setSelected(new Set())}>Limpar</Button>
            </div>
          </div>
        )}
      </section>

      <section>
        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-[1.75rem]" />)}
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed bg-card p-12 text-center shadow-card">
            <UsersRound className="mx-auto text-muted-foreground" size={42} />
            <h2 className="mt-4 font-display text-xl font-extrabold tracking-normal">Nenhum profissional encontrado</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ajuste filtros ou cadastre um novo profissional.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {data.map((pro) => (
              <ProfessionalCard
                key={pro.id}
                pro={pro}
                selected={selected.has(pro.id)}
                onToggle={() => toggle(pro.id)}
                onOpen={(tab) => openDetail(pro.id, tab)}
                onVerify={(s) => verify.mutate({ id: pro.id, s })}
                onFeature={() => feat.mutate({ id: pro.id, f: !pro.is_featured })}
                onStatus={(s) => statusMut.mutate({ id: pro.id, s })}
              />
            ))}
          </div>
        )}
      </section>

      {data.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground shadow-card">
          <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-foreground">
            <Checkbox checked={data.every((p) => selected.has(p.id))} onCheckedChange={toggleAll} />
            Selecionar todos da tela
          </label>
          <span>{data.length} profissional(is) exibidos</span>
        </div>
      )}
    </div>
  );
}

function ProfessionalCard({
  pro,
  selected,
  onToggle,
  onOpen,
  onVerify,
  onFeature,
  onStatus,
}: {
  pro: AdminProRow;
  selected: boolean;
  onToggle: () => void;
  onOpen: (tab?: string) => void;
  onVerify: (s: "approved" | "rejected" | "pending") => void;
  onFeature: () => void;
  onStatus: (s: "published" | "archived") => void;
}) {
  const name = pro.professional_name || pro.business_name || "Sem nome";
  const location = pro.city ? `${pro.city}/${pro.state ?? ""}` : "Sem localização";
  return (
    <article className="group relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-card transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-float">
      <div className="h-24 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_92%,white),color-mix(in_oklab,var(--primary)_54%,var(--orange)))]" />
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="border-primary-foreground/70 bg-card/95"
          aria-label={`Selecionar ${name}`}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline" className="h-9 w-9 rounded-full bg-card/95" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onOpen("overview")}><Eye size={14} className="mr-2" />Ver painel</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpen("profile")}><Pencil size={14} className="mr-2" />Editar perfil</DropdownMenuItem>
            {pro.slug && (
              <DropdownMenuItem asChild>
                <Link to="/profissional/$slug" params={{ slug: pro.slug }} target="_blank">
                  <ExternalLink size={14} className="mr-2" />Perfil público
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {pro.verification_status !== "approved" && <DropdownMenuItem onClick={() => onVerify("approved")}><BadgeCheck size={14} className="mr-2 text-primary" />Aprovar</DropdownMenuItem>}
            {pro.verification_status !== "rejected" && <DropdownMenuItem onClick={() => onVerify("rejected")}><X size={14} className="mr-2" />Rejeitar</DropdownMenuItem>}
            {pro.verification_status !== "pending" && <DropdownMenuItem onClick={() => onVerify("pending")}><RefreshCw size={14} className="mr-2" />Reanalisar</DropdownMenuItem>}
            <DropdownMenuItem onClick={onFeature}><Star size={14} className={`mr-2 ${pro.is_featured ? "fill-orange text-orange" : ""}`} />{pro.is_featured ? "Remover destaque" : "Destacar"}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onStatus("archived")} className="text-destructive focus:text-destructive"><PauseCircle size={14} className="mr-2" />Suspender</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatus("published")}><PlayCircle size={14} className="mr-2" />Reativar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <button type="button" onClick={() => onOpen("overview")} className="block w-full p-5 pt-0 text-left">
        <div className="-mt-9 flex items-end justify-between gap-3">
          <InitialsAvatar name={name} className="h-[4.5rem] w-[4.5rem] border-4 border-card text-xl shadow-card" />
          <StatusPill tone={pro.verification_status === "approved" ? "success" : pro.verification_status === "rejected" ? "danger" : "warning"}>
            {VERIF_LABEL[pro.verification_status] ?? pro.verification_status}
          </StatusPill>
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate font-display text-xl font-extrabold tracking-normal text-foreground group-hover:text-primary">{name}</h2>
              {pro.verification_status === "approved" && <BadgeCheck className="text-primary" size={17} />}
              {pro.is_featured && <Star className="fill-orange text-orange" size={15} />}
            </div>
            {pro.business_name && pro.business_name !== pro.professional_name && (
              <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground"><Building2 size={12} />{pro.business_name}</div>
            )}
          </div>
          <div className="shrink-0 rounded-2xl bg-rating/15 px-3 py-1.5 text-sm font-extrabold text-foreground">
            ★ {pro.average_rating ? Number(pro.average_rating).toFixed(1) : "—"}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><MapPin size={12} />{location}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">{pro.reviews_count ?? 0} avaliações</span>
          <span className="rounded-full bg-muted px-2.5 py-1">Cadastro {new Date(pro.created_at).toLocaleDateString("pt-BR")}</span>
        </div>
        <p className="mt-4 line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-muted-foreground">
          {pro.description || "Perfil sem descrição pública. Abra o painel para completar apresentação, serviços, portfólio e documentos."}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4 text-center text-xs">
          <MiniStat label="Reviews" value={`${pro.reviews_count ?? 0}`} />
          <MiniStat label="WhatsApp" value={pro.whatsapp ? "Sim" : "—"} />
          <MiniStat label="Slug" value={pro.slug ? "OK" : "—"} />
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-primary">Abrir central completa</span>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground transition group-hover:translate-x-1">
            <ArrowRight size={16} />
          </span>
        </div>
      </button>
    </article>
  );
}

function Metric({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/85 p-4 shadow-card backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
        <div className="font-display text-2xl font-extrabold tracking-normal">{value}</div>
      </div>
      <div className="mt-3 text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function QueueRow({ label, value, tone }: { label: string; value: number; tone: "primary" | "success" | "warning" }) {
  const color = tone === "success" ? "bg-success" : tone === "warning" ? "bg-orange" : "bg-primary";
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-card px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm font-semibold"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</div>
      <div className="font-display text-lg font-extrabold tracking-normal">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-base font-extrabold tracking-normal text-foreground">{value}</div>
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
    </div>
  );
}