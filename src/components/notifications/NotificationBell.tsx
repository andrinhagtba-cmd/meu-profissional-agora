import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNotificationCenter } from "@/hooks/use-notification-center";
import { NotificationIcon, relativeTime } from "./notificationVisuals";

export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { items, unreadCount, markRead, markAll, isAuthenticated, isLoading } =
    useNotificationCenter({ enabled: open });

  if (!isAuthenticated) return null;

  const recent = items.slice(0, 6);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={unreadCount > 0 ? `Notificações (${unreadCount} não lidas)` : "Notificações"}
          className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary ${className ?? ""}`}
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-accent-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-display text-sm font-bold text-foreground">Notificações</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAll.mutate("all")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <CheckCheck size={13} /> Marcar todas
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Carregando…</p>
          ) : recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação por aqui.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((n) => {
                const body = (
                  <div className="flex items-start gap-3 px-4 py-3">
                    <NotificationIcon type={n.type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
                      {n.message && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {relativeTime(n.created_at)}
                      </p>
                    </div>
                    {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                );
                return (
                  <li key={n.id} className={n.read ? "" : "bg-secondary/40"}>
                    {n.link ? (
                      <a
                        href={n.link}
                        onClick={() => {
                          if (!n.read) markRead.mutate([n.id]);
                          setOpen(false);
                        }}
                        className="block transition-colors hover:bg-secondary/70"
                      >
                        {body}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => !n.read && markRead.mutate([n.id])}
                        className="block w-full text-left transition-colors hover:bg-secondary/70"
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border p-3">
          <Button asChild variant="outline" className="h-10 w-full rounded-xl font-semibold">
            <Link to="/painel/notificacoes" onClick={() => setOpen(false)}>
              Ver central de notificações
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
