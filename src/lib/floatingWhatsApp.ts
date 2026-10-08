import { buildWhatsAppUrl } from "./whatsapp";

export type WhatsAppProfile = {
  slug: string;
  name: string;
  whatsapp?: string | null;
};

export function profileWhatsAppCta(profile: WhatsAppProfile) {
  const message = `Olá, ${profile.name}! Encontrei seu perfil no Guia DF na Mídia e gostaria de mais informações sobre seus produtos ou serviços.`;
  return {
    href: buildWhatsAppUrl(profile.whatsapp, message),
    title: `Fale com ${profile.name}`,
    description: "Peça informações ou um orçamento pelo WhatsApp.",
    label: `Falar com ${profile.name} no WhatsApp`,
    seenKey: `gdf:whatsapp-bubble-seen:${profile.slug}`,
  };
}