import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { Logo } from "./Header";
import { getSettings, type FooterColumn } from "@/services/settingsService";
import { normalizeExternalUrl } from "@/lib/externalUrl";

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: "Plataforma",
    links: [
      { label: "Como funciona", href: "/sobre" },
      { label: "Categorias", href: "/categorias" },
      { label: "Profissionais", href: "/profissionais" },
      { label: "Pedir orçamento", href: "/pedir-orcamento" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Profissionais",
    links: [
      { label: "Criar perfil", href: "/cadastro/profissional" },
      { label: "Entrar", href: "/entrar" },
      { label: "Planos", href: "/planos" },
      { label: "Central de ajuda", href: "/contato" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre", href: "/sobre" },
      { label: "Contato", href: "/contato" },
      { label: "Trabalhe conosco", href: "/contato" },
      { label: "Imprensa", href: "/contato" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Termos de uso", href: "/sobre" },
      { label: "Privacidade", href: "/sobre" },
      { label: "Cookies", href: "/sobre" },
      { label: "Diretrizes de avaliação", href: "/sobre" },
    ],
  },
];

function isExternal(href: string) {
  return /^(https?:|mailto:|tel:)/i.test(href);
}

function FooterLinkItem({ href, label }: { href: string; label: string }) {
  const cls = "text-sm text-muted-foreground transition-colors hover:text-primary";
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {label}
      </a>
    );
  }
  return (
    <Link to={href} className={cls}>
      {label}
    </Link>
  );
}

export function Footer() {
  const { data: settings } = useQuery({
    queryKey: ["system-settings", "public"],
    queryFn: () => getSettings(false),
    staleTime: 5 * 60 * 1000,
  });

  const cfg = settings?.footer_config ?? {};
  const columns = cfg.columns && cfg.columns.length > 0 ? cfg.columns : DEFAULT_COLUMNS;
  const description =
    cfg.description ??
    "O jeito mais simples de encontrar profissionais de confiança perto de você. Compare, contrate e avalie sem complicação.";
  const contactEmail = cfg.contact_email ?? settings?.support_email ?? "contato@proconecta.com.br";
  const copyright = cfg.copyright ?? `${settings?.brand_name ?? "plataforma"}. Todos os direitos reservados.`;
  const cnpjNote = cfg.cnpj_note ?? "";

  const socials = [
    settings?.social_instagram && { icon: Instagram, label: "Instagram", href: normalizeExternalUrl(settings.social_instagram, "instagram") },
    settings?.social_facebook && { icon: Facebook, label: "Facebook", href: normalizeExternalUrl(settings.social_facebook, "facebook") },
    settings?.social_youtube && { icon: Youtube, label: "YouTube", href: normalizeExternalUrl(settings.social_youtube, "youtube") },
    settings?.social_linkedin && { icon: Linkedin, label: "LinkedIn", href: normalizeExternalUrl(settings.social_linkedin, "linkedin") },
  ].filter((s): s is { icon: typeof Instagram; label: string; href: string } => Boolean(s && s.href));

  const fallbackSocials =
    socials.length === 0
      ? [
          { icon: Instagram, label: "Instagram", href: "#" },
          { icon: Facebook, label: "Facebook", href: "#" },
          { icon: Youtube, label: "YouTube", href: "#" },
          { icon: Linkedin, label: "LinkedIn", href: "#" },
        ]
      : socials;

  return (
    <footer className="border-t border-border bg-card">
      <div className="container-page py-10 sm:py-14">
        <div className="grid gap-10">
          <div
            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:gap-10 md:[grid-template-columns:var(--footer-cols)]"
            style={
              {
                "--footer-cols": `2fr repeat(${columns.length}, minmax(0, 1fr))`,
              } as React.CSSProperties
            }
          >
            <div className="min-w-0 sm:col-span-2 md:col-span-1">

              <Logo />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
              <div className="mt-5 flex gap-2">
                {fallbackSocials.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target={href === "#" ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    aria-label={label}
                    onClick={href === "#" ? (e) => e.preventDefault() : undefined}
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
                      <FooterLinkItem href={link.href} label={link.label} />
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {copyright}
            {cnpjNote ? ` · ${cnpjNote}` : ""}
          </p>
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <Mail size={13} aria-hidden="true" />
              {contactEmail}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
