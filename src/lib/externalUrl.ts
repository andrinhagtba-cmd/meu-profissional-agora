/**
 * Normaliza URLs externas (redes sociais, site) para que sempre tenham protocolo.
 * Sem isso, valores como "instagram.com/fulano" ou "@fulano" são tratados como
 * caminhos relativos e o navegador abre o próprio site em vez da rede social.
 */

const SOCIAL_BASE: Record<string, string> = {
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  youtube: "https://youtube.com/@",
  linkedin: "https://linkedin.com/in/",
  tiktok: "https://tiktok.com/@",
};

export function normalizeExternalUrl(
  value: string | null | undefined,
  network?: keyof typeof SOCIAL_BASE,
): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw || raw === "#") return null;

  // já é um link absoluto / protocolo especial
  if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw;

  // "//dominio.com"
  if (raw.startsWith("//")) return `https:${raw}`;

  // handle "@usuario" ou apenas "usuario"
  const handle = raw.replace(/^@/, "");
  const looksLikeDomain = /\./.test(handle) && !handle.startsWith("/");

  if (looksLikeDomain) return `https://${handle.replace(/^\/+/, "")}`;

  if (network && SOCIAL_BASE[network]) {
    return `${SOCIAL_BASE[network]}${handle.replace(/^\/+/, "")}`;
  }

  return `https://${handle.replace(/^\/+/, "")}`;
}
