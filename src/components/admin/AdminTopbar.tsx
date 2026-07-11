import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Moon, Sun, LogOut, User as UserIcon, Search, Bell } from "lucide-react";
import {
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from "@/components/ui/command";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

const QUICK_NAV: { to: string; label: string; group: string }[] = [
  { to: "/admin", label: "Dashboard", group: "Visão geral" },
  { to: "/admin/usuarios", label: "Usuários", group: "Pessoas" },
  { to: "/admin/profissionais", label: "Profissionais", group: "Pessoas" },
  { to: "/admin/verificacoes", label: "Verificações", group: "Pessoas" },
  { to: "/admin/categorias", label: "Categorias", group: "Marketplace" },
  { to: "/admin/servicos", label: "Serviços", group: "Marketplace" },
  { to: "/admin/solicitacoes", label: "Solicitações", group: "Marketplace" },
  { to: "/admin/avaliacoes", label: "Avaliações", group: "Marketplace" },
  { to: "/admin/denuncias", label: "Denúncias", group: "Marketplace" },
  { to: "/admin/planos", label: "Planos", group: "Monetização" },
  { to: "/admin/assinaturas", label: "Assinaturas", group: "Monetização" },
  { to: "/admin/midias", label: "Mídias", group: "Conteúdo" },
  { to: "/admin/blog", label: "Blog", group: "Conteúdo" },
  { to: "/admin/configuracoes", label: "Configurações", group: "Sistema" },
  { to: "/admin/logs", label: "Logs", group: "Sistema" },
];

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const saved = (localStorage.getItem("pc-theme") as "light" | "dark" | null) ?? "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("pc-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };
  return { theme, toggle };
}

function toCrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const acc: { href: string; label: string }[] = [];
  let path = "";
  for (const p of parts) {
    path += "/" + p;
    acc.push({ href: path, label: p.charAt(0).toUpperCase() + p.slice(1) });
  }
  return acc;
}

export function AdminTopbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [cmdOpen, setCmdOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const crumbs = toCrumbs(pathname);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const grouped = QUICK_NAV.reduce<Record<string, typeof QUICK_NAV>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-[oklch(0.93_0.014_258)] bg-white px-4 shadow-[0_1px_0_0_oklch(0.93_0.014_258)]">
      <SidebarTrigger className="text-muted-foreground hover:text-primary" />
      <div className="hidden min-w-0 flex-1 md:block">
        <Breadcrumb>
          <BreadcrumbList className="text-[13px]">
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-2">
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {i === crumbs.length - 1 ? (
                    <BreadcrumbPage className="font-semibold text-foreground">{c.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={c.href as never} className="text-muted-foreground hover:text-foreground">{c.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-[13px] text-muted-foreground transition-colors hover:bg-muted sm:flex"
        >
          <Search size={14} />
          <span>Buscar…</span>
          <kbd className="ml-6 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
        </button>
        <Button variant="ghost" size="icon" onClick={() => setCmdOpen(true)} className="sm:hidden">
          <Search size={16} />
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link to="/painel/notificacoes"><Bell size={16} /></Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {(user?.email ?? "A").charAt(0).toUpperCase()}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{user?.email ?? "Admin"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/painel"><UserIcon size={14} className="mr-2" /> Meu painel</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut}>
              <LogOut size={14} className="mr-2" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Buscar páginas, usuários, profissionais..." />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          {Object.entries(grouped).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((it) => (
                <CommandItem
                  key={it.to}
                  onSelect={() => {
                    setCmdOpen(false);
                    navigate({ to: it.to as never });
                  }}
                >
                  {it.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </header>
  );
}
