import { Link, useNavigate } from "@tanstack/react-router";
import { Briefcase, Heart, LogOut, Menu, Search, User } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useBrand } from "@/hooks/use-brand";
import { getMyProfile } from "@/services/clientService";
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
          <Button asChild className="ml-1 h-11 rounded-xl px-3 text-sm font-semibold sm:px-5">
            <Link to="/cadastro/profissional">
              <Briefcase className="sm:hidden" size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Sou profissional</span>
              <span className="sm:hidden">Profissional</span>
            </Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-secondary xl:hidden"
              >
                <Menu size={22} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-left font-display">Menu</SheetTitle>
              </SheetHeader>
              <nav aria-label="Menu mobile" className="flex flex-col gap-1 px-4">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-secondary hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-3 border-t border-border" />
                <Link
                  to="/favoritos"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Favoritos
                </Link>
                <Link
                  to="/entrar"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Entrar
                </Link>
                <Button asChild className="mt-2 h-12 rounded-xl text-base font-semibold">
                  <Link to="/cadastro/profissional" onClick={() => setOpen(false)}>
                    Sou profissional
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
