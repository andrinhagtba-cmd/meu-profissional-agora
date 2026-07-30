import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Home, MessageSquare, ClipboardList, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationCenter } from "@/hooks/use-notification-center";

type TabItem = {
  to: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  badge?: boolean;
};

const items: TabItem[] = [
  { to: "/painel", label: "Painel", icon: Home, exact: true },
  { to: "/painel/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/painel/mensagens", label: "Chat", icon: MessageSquare },
  { to: "/painel/notificacoes", label: "Alertas", icon: Bell, badge: true },
  { to: "/painel/perfil", label: "Perfil", icon: UserRound },
];

/** Barra de navegação inferior estilo app nativo (somente mobile e usuário logado). */
export function MobileTabBar() {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { unreadCount } = useNotificationCenter({ enabled: false });

  if (loading || !user) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const showBadge = item.badge && unreadCount > 0;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="relative">
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                  {showBadge && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
                {item.label}
                {active && (
                  <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
