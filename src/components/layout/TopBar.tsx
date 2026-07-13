import { BadgeCheck, Headset, MessageCircle, Star } from "lucide-react";

const items = [
  { icon: BadgeCheck, text: "Profissionais verificados no DF" },
  { icon: Star, text: "Avaliações reais no Distrito Federal" },
  { icon: MessageCircle, text: "Orçamento direto no DF" },
  { icon: Headset, text: "Suporte especializado para o DF" },
];

export function TopBar() {
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="container-page flex h-9 items-center justify-center gap-8 overflow-hidden text-xs font-medium">
        {items.map(({ icon: Icon, text }, i) => (
          <span
            key={text}
            className={
              i > 1 ? "hidden items-center gap-1.5 md:inline-flex" : "inline-flex items-center gap-1.5"
            }
          >
            <Icon size={13} aria-hidden="true" />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
