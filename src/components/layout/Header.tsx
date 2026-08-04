import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Briefcase, Heart, LogOut, Menu, Search, User } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useBrand } from "@/hooks/use-brand";
import { getMyProfile } from "@/services/clientService";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { to: "/", label: "Início" },
  { to: "/categorias", label: "Categorias" },
  { to: "/profissionais", label: "Profissionais" },
  { to: "/sobre", label: "Como funciona", hash: "como-funciona" },
  { to: "/planos", label: "Para profissionais" },
  { to: "/blog", label: "Blog" },
  { to: "/sobre", label: "Sobre" },
] as const;

export function Logo({ className }: { className?: string }) {
  const { data } = useBrand();
  const logoUrl = data?.logo_light_url;
  const name = data?.brand_name?.trim() ?? "";
  const tagline = data?.tagline?.trim() ?? "";
  return (
    <Link
      to="/"
      className={`flex items-center ${className ?? ""}`}
      aria-label={name ? `${name} — página inicial` : "Página inicial"}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name || "Logo"}
          className="h-9 w-auto max-w-[160px] object-contain sm:h-12 sm:max-w-[260px]"
        />
      ) : (
        <span className="min-w-0 leading-tight">
          <span className="block font-display text-lg font-extrabold tracking-tight text-foreground">
            {name || "\u00A0"}
          </span>
          {tagline ? (
            <span className="block text-[10px] font-medium text-muted-foreground">
              {tagline}
            </span>
          ) : null}
        </span>
      )}
    </Link>
  );
}



export function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: myProfile } = useQuery({
    queryKey: ["my-profile-header", user?.id],
    queryFn: () => getMyProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 60_000,
  });
  const avatarUrl = myProfile?.avatar_url ?? null;

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Você saiu da sua conta.");
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="container-page grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:h-16 sm:gap-3 lg:flex lg:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">

          <Logo />
          <nav aria-label="Navegação principal" className="hidden items-center gap-1 xl:flex">
            {navItems.slice(0, 7).map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary [&.active]:text-primary"
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Buscar"
            onClick={() => navigate({ to: "/buscar", search: {} as never })}
            className="hidden h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary sm:inline-flex"
          >
            <Search size={19} />
          </button>
          <Link
            to="/favoritos"
            aria-label="Favoritos"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary sm:inline-flex"
          >
            <Heart size={19} />
          </Link>
          <NotificationBell />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Minha conta"
                  className="hidden h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground text-sm font-semibold transition-colors hover:bg-primary/90 sm:inline-flex"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (user.email ?? "?").slice(0, 1).toUpperCase()
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/painel"><User className="mr-2" size={16} /> Meu painel</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/favoritos"><Heart className="mr-2" size={16} /> Favoritos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/painel/notificacoes"><Bell className="mr-2" size={16} /> Notificações</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2" size={16} /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/entrar"
              aria-label="Entrar"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary sm:inline-flex"
            >
              <User size={19} />
            </Link>
          )}
          <Button
            asChild
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl p-0 sm:h-11 sm:w-auto sm:px-5 sm:text-sm sm:font-semibold"
            aria-label="Sou profissional"
          >
            <Link to="/cadastro/profissional">
              <Briefcase className="sm:hidden" size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Sou profissional</span>
            </Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-secondary/40 text-foreground transition-all hover:bg-secondary active:scale-95 sm:h-11 sm:w-11 xl:hidden"
              >
                <Menu size={22} />
              </button>

            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-[88vw] max-w-sm flex-col gap-0 border-l border-border/60 bg-card p-0"
            >
              <SheetHeader className="border-b border-border/60 bg-gradient-to-br from-primary/10 via-card to-card px-5 pb-5 pt-6 text-left">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                {user ? (
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary text-base font-bold text-primary-foreground">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (user.email ?? "?").slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-base font-extrabold text-foreground">
                        Minha conta
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                    </span>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <Logo />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Encontre profissionais de confiança perto de você.
                    </p>
                  </div>
                )}
              </SheetHeader>

              <nav
                aria-label="Menu mobile"
                className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
              >
                <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Navegação
                </p>
                <div className="flex flex-col gap-0.5">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="group flex min-h-12 items-center justify-between gap-3 rounded-xl px-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary active:bg-secondary [&.active]:bg-primary/10 [&.active]:text-primary"
                      activeOptions={{ exact: item.to === "/" }}
                    >
                      <span className="truncate">{item.label}</span>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  ))}
                </div>

                <p className="px-2 pb-2 pt-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Atalhos
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      navigate({ to: "/buscar", search: {} as never });
                    }}
                    className="flex min-h-[76px] flex-col items-start justify-center gap-1.5 rounded-2xl border border-border/70 bg-secondary/40 px-3 text-left text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    <Search size={18} className="text-primary" />
                    Buscar
                  </button>
                  <Link
                    to="/favoritos"
                    onClick={() => setOpen(false)}
                    className="flex min-h-[76px] flex-col items-start justify-center gap-1.5 rounded-2xl border border-border/70 bg-secondary/40 px-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    <Heart size={18} className="text-accent" />
                    Favoritos
                  </Link>
                  {user ? (
                    <>
                      <Link
                        to="/painel"
                        onClick={() => setOpen(false)}
                        className="flex min-h-[76px] flex-col items-start justify-center gap-1.5 rounded-2xl border border-border/70 bg-secondary/40 px-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                      >
                        <User size={18} className="text-primary" />
                        Meu painel
                      </Link>
                      <Link
                        to="/painel/notificacoes"
                        onClick={() => setOpen(false)}
                        className="flex min-h-[76px] flex-col items-start justify-center gap-1.5 rounded-2xl border border-border/70 bg-secondary/40 px-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                      >
                        <Bell size={18} className="text-primary" />
                        Notificações
                      </Link>
                    </>
                  ) : null}
                </div>
              </nav>

              <div className="border-t border-border/60 bg-card px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4">
                <Button asChild className="h-12 w-full rounded-xl text-base font-semibold">
                  <Link to="/cadastro/profissional" onClick={() => setOpen(false)}>
                    <Briefcase size={18} aria-hidden="true" />
                    Sou profissional
                  </Link>
                </Button>
                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      void handleSignOut();
                    }}
                    className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <LogOut size={16} /> Sair da conta
                  </button>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    className="mt-2 h-11 w-full rounded-xl text-sm font-semibold"
                  >
                    <Link to="/entrar" onClick={() => setOpen(false)}>
                      Entrar
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

        </div>
      </div>
    </header>
  );
}
