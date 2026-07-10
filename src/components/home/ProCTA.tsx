import { Link } from "@tanstack/react-router";
import { BadgeCheck, Briefcase, Images, LineChart, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const perks = [
  { icon: Briefcase, text: "Perfil profissional público" },
  { icon: Users, text: "Contatos de clientes da região" },
  { icon: Images, text: "Portfólio de trabalhos" },
  { icon: Star, text: "Avaliações que geram confiança" },
  { icon: BadgeCheck, text: "Planos de destaque" },
  { icon: LineChart, text: "Gestão de oportunidades" },
];

export function ProCTA() {
  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="cta-profissionais">
      <div className="relative overflow-hidden rounded-4xl bg-navy px-6 py-12 text-navy-foreground shadow-card sm:px-12 sm:py-16">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-orange/25 blur-3xl" aria-hidden="true" />
        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 id="cta-profissionais" className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              Você presta serviços?
              <br />
              <span className="text-orange">Encontre novos clientes todos os dias.</span>
            </h2>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-13 rounded-xl bg-orange px-7 text-base font-semibold text-orange-foreground hover:bg-orange/90"
              >
                <Link to="/cadastro/profissional">Criar perfil profissional</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-13 rounded-xl border-navy-foreground/25 bg-transparent px-7 text-base font-semibold text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"
              >
                <Link to="/planos">Conhecer os planos</Link>
              </Button>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 rounded-2xl bg-navy-foreground/8 px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy-foreground/12 text-orange">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <span className="text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
