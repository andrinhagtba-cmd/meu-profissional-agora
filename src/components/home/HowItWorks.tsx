import { ClipboardList, MapPin, Scale, Star } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    color: "bg-secondary text-primary",
    title: "Conte o que precisa",
    text: "Descreva o serviço em poucos cliques, com fotos se quiser.",
  },
  {
    icon: MapPin,
    color: "bg-orange/10 text-orange",
    title: "Encontre profissionais próximos",
    text: "Receba indicações de quem atende na sua região.",
  },
  {
    icon: Scale,
    color: "bg-success-soft text-success",
    title: "Compare perfis e orçamentos",
    text: "Avaliações reais, preços e tempo de resposta lado a lado.",
  },
  {
    icon: Star,
    color: "bg-rating/15 text-rating",
    title: "Contrate e avalie",
    text: "Feche direto com o profissional e avalie o atendimento.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-card py-16 sm:py-20" aria-labelledby="como-funciona" id="como-funciona">
      <div className="container-page">
        <h2 id="como-funciona-titulo" className="text-center font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Como funciona
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center text-muted-foreground">
          Do pedido ao serviço concluído em quatro passos simples.
        </p>
        <ol className="relative mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="relative flex gap-4 lg:block lg:text-center">
              <div className="flex flex-col items-center lg:mb-4">
                <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${step.color} lg:mx-auto`}>
                  <step.icon size={26} aria-hidden="true" />
                </span>
                {i < steps.length - 1 && (
                  <span className="mt-2 h-full w-px bg-border lg:hidden" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Passo {i + 1}</p>
                <h3 className="mt-1 font-display text-lg font-bold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
