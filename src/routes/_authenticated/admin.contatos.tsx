import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertOctagon,
  Archive,
  CheckCircle2,
  Clock3,
  Filter,
  Flame,
  Inbox,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { InitialsAvatar, StatusPill } from "@/components/admin/AdminTable";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listContactsAdmin,
  updateContactMessage,
  deleteContactMessage,
  type AdminContactRow,
  type ContactPriority,
  type ContactStatus,
} from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/contatos")({
  head: () => ({ meta: [{ title: "Contatos · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ContatosPage,
});

const STATUS_LABEL: Record<ContactStatus, string> = {
  new: "Novos",
  in_progress: "Em atendimento",
  waiting: "Aguardando",
  resolved: "Resolvidos",
  archived: "Arquivados",
};

const STATUS_TONE: Record<ContactStatus, "info" | "warning" | "success" | "danger" | "neutral"> = {
  new: "warning",
  in_progress: "info",
  waiting: "warning",
  resolved: "success",
  archived: "neutral",
};

const PRIORITY_LABEL: Record<ContactPriority, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const PRIORITY_TONE: Record<ContactPriority, "info" | "warning" | "success" | "danger" | "neutral"> = {
  low: "neutral",
  normal: "info",
  high: "warning",
  urgent: "danger",
};

const STATUS_FILTERS: { value: string; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { value: "", label: "Todos", icon: Inbox },
  { value: "new", label: "Novos", icon: Flame },
  { value: "in_progress", label: "Em atendimento", icon: Clock3 },
  { value: "waiting", label: "Aguardando", icon: Clock3 },
  { value: "resolved", label: "Resolvidos", icon: CheckCircle2 },
  { value: "archived", label: "Arquivados", icon: Archive },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "há minutos";
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function ContatosPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<AdminContactRow | null>(null);
  const [note, setNote] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-contatos", status, priority, search],
    queryFn: () => listContactsAdmin({ status: status || undefined, priority: priority || undefined, search: search || undefined }),
  });

  const stats = useMemo(() => {
    const total = data.length;
    const news = data.filter((c) => c.status === "new").length;
    const urgent = data.filter((c) => c.priority === "urgent" || c.priority === "high").length;
    const resolved = data.filter((c) => c.status === "resolved").length;
    return { total, news, urgent, resolved };
  }, [data]);

  const update = useMutation({
    mutationFn: (v: { id: string; patch: Partial<Pick<AdminContactRow, "status" | "priority" | "internal_note">> }) => updateContactMessage(v.id, v.patch),
    onSuccess: () => {
      toast.success("Contato atualizado");
      qc.invalidateQueries({ queryKey: ["admin-contatos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteContactMessage(id),
    onSuccess: () => {
      toast.success("Contato removido");
      setDetail(null);
      qc.invalidateQueries({ queryKey: ["admin-contatos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openDetail = (row: AdminContactRow) => {
    setDetail(row);
    setNote(row.internal_note ?? "");
  };

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-5 shadow-float sm:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_30%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_45%),radial-gradient(circle_at_55%_70%,color-mix(in_oklab,var(--orange)_14%,transparent),transparent_35%)] lg:block" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles size={14} /> Inbox de suporte
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">Contatos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Mensagens do formulário público, e-mail e canais integrados, com priorização e notas internas.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={<Inbox size={18} />} label="Total" value={stats.total} />
            <Metric icon={<Flame size={18} />} label="Novos" value={stats.news} />
            <Metric icon={<AlertOctagon size={18} />} label="Alta prioridade" value={stats.urgent} />
            <Metric icon={<CheckCircle2 size={18} />} label="Resolvidos" value={stats.resolved} />
          </div>
        </div>
      </section>

      {/* TOOLBAR */}
      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => {
              const active = status === f.value;
              const Icon = f.icon;
              return (
                <button
                  key={f.value || "all"}
                  type="button"
                  onClick={() => setStatus(f.value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground shadow-card" : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"}`}
                >
                  <Icon size={14} /> {f.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={priority || "all"} onValueChange={(v) => setPriority(v === "all" ? "" : v)}>
              <SelectTrigger className="h-11 w-40 rounded-full border-border/80 bg-background"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                {(Object.keys(PRIORITY_LABEL) as ContactPriority[]).map((p) => (
                  <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative min-w-0 sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome…"
                className="h-11 rounded-full border-border/80 bg-background pl-9 shadow-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* LIST */}
      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Nenhum contato aqui — quando alguém enviar uma mensagem pelo site ela aparecerá nesta caixa.
          </div>
        ) : (
          <ul className="space-y-2">
            {data.map((c) => (
              <ContactRow key={c.id} c={c} onOpen={() => openDetail(c)} />
            ))}
          </ul>
        )}
      </section>

      {/* DETAIL DRAWER */}
      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl">{detail.subject || detail.name}</SheetTitle>
                <SheetDescription>
                  Recebido em {new Date(detail.created_at).toLocaleString("pt-BR")} · canal: {detail.channel}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-2">
                  <StatusPill tone={STATUS_TONE[detail.status]}>{STATUS_LABEL[detail.status]}</StatusPill>
                  <StatusPill tone={PRIORITY_TONE[detail.priority]}>Prioridade: {PRIORITY_LABEL[detail.priority]}</StatusPill>
                </div>
                <div className="rounded-2xl border bg-background p-4">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={detail.name} className="h-10 w-10" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{detail.name}</div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Mail size={11} />{detail.email}</span>
                        {detail.phone && <span className="inline-flex items-center gap-1"><Phone size={11} />{detail.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-line text-sm text-foreground">{detail.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Status</Label>
                    <Select value={detail.status} onValueChange={(v) => update.mutate({ id: detail.id, patch: { status: v as ContactStatus } })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_LABEL) as ContactStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={detail.priority} onValueChange={(v) => update.mutate({ id: detail.id, patch: { priority: v as ContactPriority } })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PRIORITY_LABEL) as ContactPriority[]).map((p) => (
                          <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Nota interna</Label>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Registro para o time…" className="rounded-xl" />
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" className="rounded-full" disabled={update.isPending} onClick={() => update.mutate({ id: detail.id, patch: { internal_note: note } })}>
                      Salvar nota
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1 rounded-full">
                    <a href={`mailto:${detail.email}?subject=Re:%20${encodeURIComponent(detail.subject || "Sua mensagem")}`}>
                      <MessageCircle size={14} className="mr-1" /> Responder
                    </a>
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={() => del.mutate(detail.id)} disabled={del.isPending}>
                    <Trash2 size={14} className="mr-1" /> Excluir
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold tracking-normal text-foreground">{value}</div>
    </div>
  );
}

function ContactRow({ c, onOpen }: { c: AdminContactRow; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-background p-4 text-left transition hover:border-primary/30 hover:shadow-card"
      >
        <InitialsAvatar name={c.name} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-display text-sm font-extrabold text-foreground">{c.name}</h3>
                <StatusPill tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</StatusPill>
                <StatusPill tone={PRIORITY_TONE[c.priority]}>{PRIORITY_LABEL[c.priority]}</StatusPill>
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <span className="truncate">{c.email}</span>
                {c.phone && <span className="truncate">{c.phone}</span>}
                {c.subject && <span className="truncate font-semibold text-foreground">{c.subject}</span>}
              </div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.message}</p>
        </div>
      </button>
    </li>
  );
}
