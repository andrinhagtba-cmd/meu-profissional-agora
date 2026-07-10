import { BadgeCheck, HandCoins, MapPin, MessageCircle, Star } from "lucide-react";

const benefits = [
  {
    icon: BadgeCheck,
    color: "bg-success-soft text-success",
    title: "Profissionais verificados",
    text: "Documentos analisados pela equipe",
  },
  {
    icon: MessageCircle,
    color: "bg-secondary text-primary",
    title: "Contato direto",
    text: "Fale sem intermediários",
  },
  {
    icon: Star,
    color: "bg-rating/15 text-rating",
    title: "Avaliações reais",
    text: "Notas de clientes que contrataram",
  },
  {
    icon: HandCoins,
    color: "bg-orange/10 text-orange",
    title: "Orçamento sem compromisso",
    text: "Compare antes de decidir",
  },
  {
    icon: MapPin,
    color: "bg-secondary text-primary",
    title: "Atendimento na sua região",
    text: "Quem está perto responde rápido",
  },
];

export function Benefits() {
  return (
    <section className="container-page py-14" aria-label="Benefícios da plataforma">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {benefits.map(({ icon: Icon, color, title, text }) => (
          <li
            key={title}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"
          >
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${color}`}>
              <Icon size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">{title}</h3>
              <p className="truncate text-xs text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
