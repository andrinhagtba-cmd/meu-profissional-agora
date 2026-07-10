import { Link, useNavigate } from "@tanstack/react-router";
import { Briefcase, Heart, Menu, Search, User, Wrench } from "lucide-react";
import { useState } from "react";
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
  return (
    <Link to="/" className={`flex items-center gap-2 ${className ?? ""}`} aria-label="ProConecta — página inicial">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
        <Wrench size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block font-display text-lg font-extrabold tracking-tight text-foreground">
          Pro<span className="text-primary">Conecta</span>
        </span>
        <span className="block text-[10px] font-medium text-muted-foreground">
          Resolva sem complicação
        </span>
      </span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="container-page grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:flex lg:justify-between">
        <div className="flex min-w-0 items-center gap-6">
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
          <Link
            to="/entrar"
            aria-label="Minha conta"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary sm:inline-flex"
          >
            <User size={19} />
          </Link>
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
