import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Moon, Sun, LogOut, User as UserIcon, Search, Bell, Globe, ExternalLink } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "@/services/clientService";
import { useResolvedMediaUrl } from "@/lib/mediaUrl";

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

  const { data: myProfile } = useQuery({
    queryKey: ["my-profile-admin-topbar", user?.id],
    queryFn: () => getMyProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 60_000,
  });
  const avatarUrl = useResolvedMediaUrl(myProfile?.avatar_url ?? null);
  const displayName = myProfile?.full_name || user?.email || "Admin";
  const initial = (displayName || "A").charAt(0).toUpperCase();


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
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-[oklch(0.93_0.014_258)] bg-white/85 px-2 pt-[env(safe-area-inset-top)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 sm:h-16 sm:gap-3 sm:px-4">
      <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-primary" />
      <div className="min-w-0 flex-1 md:hidden">
        <span className="block truncate font-display text-[15px] font-extrabold text-foreground">
          {crumbs[crumbs.length - 1]?.label ?? "Admin"}
        </span>
      </div>
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
      <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5">
        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          className="hidden h-10 items-center gap-2 rounded-full border border-[oklch(0.93_0.014_258)] bg-[oklch(0.98_0.01_258)] px-4 text-[13px] text-muted-foreground transition-all hover:border-primary/30 hover:bg-white hover:shadow-[0_2px_10px_-4px_oklch(0.51_0.245_262/20%)] sm:flex"
        >
          <Search size={14} className="text-primary" />
          <span>Buscar no painel…</span>
          <kbd className="ml-8 rounded-md border border-border bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">⌘K</kbd>
        </button>
        <Button variant="ghost" size="icon" onClick={() => setCmdOpen(true)} className="sm:hidden" aria-label="Buscar">
          <Search size={18} />
        </Button>
        <Button
          asChild
          variant="outline"
          className="hidden h-10 gap-2 rounded-full border-[oklch(0.93_0.014_258)] px-4 text-[13px] font-semibold text-foreground hover:border-primary/30 hover:text-primary lg:inline-flex"
        >
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Globe size={15} className="text-primary" />
            Visitar site
            <ExternalLink size={13} className="text-muted-foreground" />
          </a>
        </Button>
        <Button asChild variant="ghost" size="icon" className="hidden lg:hidden sm:inline-flex" aria-label="Visitar site">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Globe size={16} />
          </a>
        </Button>
        <Button variant="ghost" size="icon" asChild aria-label="Notificações">
          <Link to="/painel/notificacoes"><Bell size={18} /></Link>
        </Button>

        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema" className="hidden sm:inline-flex">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-primary text-xs font-bold text-primary-foreground ring-2 ring-primary/15">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="flex items-center gap-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">{myProfile?.full_name ?? "Admin"}</span>
                <span className="block truncate text-[11px] font-normal text-muted-foreground">{user?.email}</span>
              </span>
            </DropdownMenuLabel>
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
