import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  BellRing,
  Filter,
  Info,
  MailPlus,
  Radio,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { InitialsAvatar, StatusPill } from "@/components/admin/AdminTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listNotificationsAdmin,
  broadcastNotification,
  deleteNotification,
  searchProfessionalRecipients,
  notifyUserDirect,
  type AdminNotificationRow,
  type BroadcastAudience,
} from "@/services/adminService";


export const Route = createFileRoute("/_authenticated/admin/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: NotificacoesPage,
});

const TYPE_FILTERS = ["", "system", "info", "proposal", "review", "moderation", "opportunity"];
const AUDIENCE_LABELS: Record<BroadcastAudience, string> = {
  all: "Todos os usuários",
  clientes: "Somente clientes",
  profissionais: "Somente profissionais",
  admins: "Somente administradores",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "há minutos";
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function NotificacoesPage() {
  const qc = useQueryClient();
  const [type, setType] = useState("");
  const [read, setRead] = useState<"" | "read" | "unread">("");
  const [search, setSearch] = useState("");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [form, setForm] = useState({ audience: "all" as BroadcastAudience, title: "", message: "", link: "", type: "system" });

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-notifs", type, read, search],
    queryFn: () => listNotificationsAdmin({ type: type || undefined, read: read || undefined, search: search || undefined }),
  });

  const stats = useMemo(() => {
    const total = data.length;
    const unread = data.filter((n) => !n.read).length;
    const last24 = data.filter((n) => Date.now() - new Date(n.created_at).getTime() < 86_400_000).length;
    const types = new Set(data.map((n) => n.type)).size;
    return { total, unread, last24, types };
  }, [data]);

  const broadcast = useMutation({
    mutationFn: () => broadcastNotification(form),
    onSuccess: (r) => {
      toast.success(`Notificação enviada a ${r.inserted} usuário(s)`);
      setBroadcastOpen(false);
      setForm({ audience: "all", title: "", message: "", link: "", type: "system" });
      qc.invalidateQueries({ queryKey: ["admin-notifs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      toast.success("Notificação excluída");
      qc.invalidateQueries({ queryKey: ["admin-notifs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSend = form.title.trim().length >= 3 && form.message.trim().length >= 3;

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-5 shadow-float sm:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_30%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_45%),radial-gradient(circle_at_55%_70%,color-mix(in_oklab,var(--orange)_14%,transparent),transparent_35%)] lg:block" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles size={14} /> Central de comunicação
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">
                Notificações
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Histórico completo de disparos e envio manual para audiências segmentadas.
              </p>
            </div>
            <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full shadow-float">
                  <MailPlus size={16} /> Novo disparo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display">Novo disparo</DialogTitle>
                  <DialogDescription>Envie uma notificação para toda a audiência selecionada.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Audiência</Label>
                    <Select value={form.audience} onValueChange={(v) => setForm((s) => ({ ...s, audience: v as BroadcastAudience }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(AUDIENCE_LABELS) as BroadcastAudience[]).map((a) => (
                          <SelectItem key={a} value={a}>{AUDIENCE_LABELS[a]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Título</Label>
                    <Input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} maxLength={120} className="rounded-xl" />
                  </div>
                  <div>
                    <Label>Mensagem</Label>
                    <Textarea value={form.message} onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))} maxLength={500} rows={4} className="rounded-xl" />
                  </div>
                  <div>
                    <Label>Link (opcional)</Label>
                    <Input value={form.link} onChange={(e) => setForm((s) => ({ ...s, link: e.target.value }))} placeholder="/painel" className="rounded-xl" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" className="rounded-full" onClick={() => setBroadcastOpen(false)}>Cancelar</Button>
                  <Button className="rounded-full" disabled={!canSend || broadcast.isPending} onClick={() => broadcast.mutate()}>
                    <Send size={14} className="mr-1" /> Enviar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={<Bell size={18} />} label="No filtro" value={stats.total} />
            <Metric icon={<BellRing size={18} />} label="Não lidas" value={stats.unread} />
            <Metric icon={<Radio size={18} />} label="Últimas 24h" value={stats.last24} />
            <Metric icon={<Users size={18} />} label="Tipos ativos" value={stats.types} />
          </div>
        </div>
      </section>

      {/* TOOLBAR */}
      <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((t) => {
              const active = type === t;
              return (
                <button
                  key={t || "all"}
                  type="button"
                  onClick={() => setType(t)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold capitalize transition ${active ? "border-primary bg-primary text-primary-foreground shadow-card" : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"}`}
                >
                  <Filter size={14} /> {t || "Todos"}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-border bg-background p-1">
              {[
                { v: "", l: "Todas" },
                { v: "unread", l: "Não lidas" },
                { v: "read", l: "Lidas" },
              ].map((r) => (
                <button
                  key={r.v || "all"}
                  type="button"
                  onClick={() => setRead(r.v as "" | "read" | "unread")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${read === r.v ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >{r.l}</button>
              ))}
            </div>
            <div className="relative min-w-0 sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título…"
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
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Nenhuma notificação neste filtro.
          </div>
        ) : (
          <ul className="space-y-2">
            {data.map((n) => <NotifRow key={n.id} n={n} onDelete={() => del.mutate(n.id)} />)}
          </ul>
        )}
      </section>
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

function NotifRow({ n, onDelete }: { n: AdminNotificationRow; onDelete: () => void }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background p-4 transition hover:border-primary/30">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
        {n.read ? <Info size={16} /> : <BellRing size={16} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-display text-sm font-extrabold text-foreground">{n.title}</h3>
              <StatusPill tone="neutral">{n.type}</StatusPill>
              {!n.read && <StatusPill tone="warning">Não lida</StatusPill>}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.message || "—"}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <InitialsAvatar name={n.user?.full_name ?? null} className="h-6 w-6 text-[10px]" />
          <div className="min-w-0 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{n.user?.full_name ?? "Usuário"}</span>
            {n.user?.email && <span> · {n.user.email}</span>}
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:border-destructive/50 hover:text-destructive"
          >
            <Trash2 size={12} /> Remover
          </button>
        </div>
      </div>
    </li>
  );
}
