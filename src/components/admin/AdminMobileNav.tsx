import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Briefcase, Receipt, ClipboardList, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const ITEMS: { to: string; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { to: "/admin", label: "Início", icon: LayoutDashboard },
  { to: "/admin/profissionais", label: "Pros", icon: Briefcase },
  { to: "/admin/assinaturas", label: "Planos", icon: Receipt },
  { to: "/admin/solicitacoes", label: "Pedidos", icon: ClipboardList },
];

export function AdminMobileNav() {
  const { setOpenMobile } = useSidebar();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) =>
    to === "/admin" ? pathname === "/admin" : pathname === to || pathname.startsWith(to + "/");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[oklch(0.93_0.014_258)] bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Navegação administrativa"
    >
      <div className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = isActive(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to as never}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-11 place-items-center rounded-full transition-all",
                  active
                    ? "bg-gradient-to-br from-[oklch(0.55_0.24_262)] to-[oklch(0.48_0.25_262)] text-white shadow-[0_6px_16px_-6px_oklch(0.51_0.245_262/60%)]"
                    : "bg-transparent",
                )}
              >
                <Icon size={17} />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          className="flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold text-muted-foreground"
        >
          <span className="grid h-8 w-11 place-items-center rounded-full">
            <Menu size={17} />
          </span>
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
