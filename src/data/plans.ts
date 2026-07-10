import type { Plan } from "@/types";

export const plans: Plan[] = [
  {
    id: "plan-gratis",
    name: "Grátis",
    price: 0,
    period: "para sempre",
    description: "Para começar a receber seus primeiros clientes.",
    features: [
      "Perfil profissional público",
      "Até 5 propostas por mês",
      "Avaliações de clientes",
      "1 categoria de serviço",
      "Suporte por e-mail",
    ],
    cta: "Começar grátis",
  },
  {
    id: "plan-profissional",
    name: "Profissional",
    price: 49.9,
    period: "por mês",
    description: "Para quem quer crescer e receber mais oportunidades.",
    features: [
      "Tudo do plano Grátis",
      "Propostas ilimitadas",
      "Até 3 categorias de serviço",
      "Portfólio com fotos ilimitadas",
      "Selo de perfil completo",
      "Estatísticas do perfil",
      "Suporte prioritário",
    ],
    highlighted: true,
    cta: "Assinar Profissional",
  },
  {
    id: "plan-destaque",
    name: "Destaque",
    price: 99.9,
    period: "por mês",
    description: "Máxima visibilidade para dominar a sua região.",
    features: [
      "Tudo do plano Profissional",
      "Posição de destaque nas buscas",
      "Selo de destaque no perfil",
      "Aparece na homepage",
      "Categorias ilimitadas",
      "Relatórios avançados",
      "Gerente de conta dedicado",
    ],
    cta: "Assinar Destaque",
  },
];
