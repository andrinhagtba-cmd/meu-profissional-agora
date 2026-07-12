import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { Logo } from "./Header";

const columns = [
  {
    title: "Plataforma",
    links: [
      { label: "Como funciona", to: "/sobre" },
      { label: "Categorias", to: "/categorias" },
      { label: "Profissionais", to: "/profissionais" },
      { label: "Pedir orçamento", to: "/pedir-orcamento" },
      { label: "Blog", to: "/blog" },
    ],
  },
  {
    title: "Profissionais",
    links: [
      { label: "Criar perfil", to: "/cadastro/profissional" },
      { label: "Entrar", to: "/entrar" },
      { label: "Planos", to: "/planos" },
      { label: "Central de ajuda", to: "/contato" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre", to: "/sobre" },
      { label: "Contato", to: "/contato" },
      { label: "Trabalhe conosco", to: "/contato" },
      { label: "Imprensa", to: "/contato" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Termos de uso", to: "/sobre" },
      { label: "Privacidade", to: "/sobre" },
      { label: "Cookies", to: "/sobre" },
      { label: "Diretrizes de avaliação", to: "/sobre" },
    ],
  },
];

const socials = [
  { icon: Instagram, label: "Instagram" },
  { icon: Facebook, label: "Facebook" },
  { icon: Youtube, label: "YouTube" },
  { icon: Linkedin, label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              O jeito mais simples de encontrar profissionais de confiança perto de você. Compare,
              contrate e avalie sem complicação.
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-bold text-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} ${BRAND_PLACEHOLDER}. Todos os direitos reservados. · CNPJ
            00.000.000/0001-00 (demonstração)
          </p>
          <a
            href="mailto:contato@proconecta.com.br"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
          >
            <Mail size={13} aria-hidden="true" />
            contato@proconecta.com.br
          </a>
        </div>
      </div>
    </footer>
  );
}
