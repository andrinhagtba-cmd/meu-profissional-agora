import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, CheckCheck, Inbox, RotateCcw } from "lucide-react";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { SwipeableRow } from "@/components/mobile/SwipeableRow";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { PushNotificationsCard } from "@/components/pwa/PushNotificationsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNotificationCenter } from "@/hooks/use-notification-center";
import { NotificationIcon, notificationVisual, relativeTime } from "@/components/notifications/notificationVisuals";
import { NOTIFICATION_GROUPS, type NotificationGroup } from "@/services/notificationService";

export const Route = createFileRoute("/_authenticated/painel/notificacoes")({
  head: () => ({
    meta: [
      { title: "Central de notificações | Painel" },
      {
        name: "description",
        content:
          "Acompanhe mensagens, propostas, avaliações e alertas do sistema em uma central única com push no celular.",
      },
      { property: "og:title", content: "Central de notificações" },
      {
        property: "og:description",
        content: "Todas as suas notificações do marketplace em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Notificacoes,
});

function Notificacoes() {
  const [group, setGroup] = useState<NotificationGroup>("all");
  const [onlyUnread, setOnlyUnread] = useState(false);

  const { items, isLoading, counters, unreadCount, markRead, markUnread, markAll, refetch } =
    useNotificationCenter({ group, onlyUnread });

  const groupsWithCount = NOTIFICATION_GROUPS.map((g) => ({
    ...g,
    count: g.value === "all" ? unreadCount : (counters?.byGroup[g.value] ?? 0),
  }));

  return (
    <SiteLayout>
      <div className="container-page py-6 lg:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              <Link to="/painel" className="hover:text-primary">← Voltar ao painel</Link>
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground lg:text-4xl">
              Central de notificações
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} notificação${unreadCount > 1 ? "ões" : ""} não lida${unreadCount > 1 ? "s" : ""}`
                : "Tudo em dia por aqui."}
            </p>
          </div>
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl px-5 font-semibold sm:w-auto"
            disabled={markAll.isPending || unreadCount === 0}
            onClick={() =>
              markAll.mutate(group, {
                onSuccess: () => toast.success("Notificações marcadas como lidas."),
              })
            }
          >
            <CheckCheck size={16} /> Marcar como lidas
          </Button>
        </div>

        <div className="mb-6">
          <PushNotificationsCard />
        </div>

        <div className="mb-5 -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {groupsWithCount.map((g) => {
            const active = group === g.value;
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => setGroup(g.value)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-primary"
                }`}
              >
                {g.label}
                {g.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-[11px] font-bold ${
                      active ? "bg-primary-foreground/20" : "bg-accent/15 text-accent"
                    }`}
                  >
                    {g.count}
                  </span>
                )}
              </button>
            );
          })}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Switch id="only-unread" checked={onlyUnread} onCheckedChange={setOnlyUnread} />
            <Label htmlFor="only-unread" className="text-sm text-muted-foreground">
              Somente não lidas
            </Label>
          </div>
        </div>

        <PullToRefresh onRefresh={refetch}>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center">
            <Inbox className="mx-auto text-primary" />
            <p className="mt-3 font-display text-base font-bold text-foreground">
              Nenhuma notificação nesta aba
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Assim que houver novidades, elas aparecem aqui e no seu celular.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => (
              <li key={n.id}>
                <SwipeableRow
                  left={
                    n.read
                      ? { label: "Não lida", icon: <RotateCcw size={16} />, tone: "muted", onAction: () => markUnread.mutate(n.id) }
                      : { label: "Marcar lida", icon: <CheckCheck size={16} />, tone: "primary", onAction: () => markRead.mutate([n.id]) }
                  }
                >
                <div
                  className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
                    n.read ? "border-border bg-card" : "border-primary/30 bg-secondary/50"
                  }`}
                >
                <div className="flex items-start gap-3 sm:gap-4">
                  <NotificationIcon type={n.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />}
                      <h2 className="font-display text-base font-bold text-foreground">{n.title}</h2>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {notificationVisual(n.type).label}
                      </span>
                      {n.priority === "high" && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                          Prioritária
                        </span>
                      )}
                    </div>
                    {n.message && <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{relativeTime(n.created_at)}</span>
                      <span aria-hidden="true">•</span>
                      <span>{new Date(n.created_at).toLocaleString("pt-BR")}</span>
                      {n.link && (
                        <a href={n.link} className="font-semibold text-primary hover:underline">
                          Abrir
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {n.read ? (
                      <button
                        type="button"
                        onClick={() => markUnread.mutate(n.id)}
                        className="inline-flex min-h-11 items-center gap-1 px-2 text-xs font-semibold text-muted-foreground hover:text-primary"
                      >
                        <RotateCcw size={13} /> Não lida
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markRead.mutate([n.id])}
                        className="inline-flex min-h-11 items-center gap-1 px-2 text-xs font-semibold text-primary hover:underline"
                      >
                        <Bell size={13} /> Marcar lida
                      </button>
                    )}
                  </div>
                </div>
                </div>
                </SwipeableRow>
              </li>
            ))}
          </ul>
        )}
        </PullToRefresh>
      </div>
    </SiteLayout>
  );
}
