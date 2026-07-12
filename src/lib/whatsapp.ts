/**
 * Normaliza um telefone brasileiro para o formato E.164 sem "+" (ex: 5561999999999).
 * Aceita entradas com máscara, com/sem +55 e com/sem 9 no celular.
 * Retorna null se o número não parecer válido.
 */
export function normalizeWhatsAppPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = String(raw).replace(/\D+/g, "");
  if (!digits) return null;
  // Se já veio com 55 (país) + 10/11 dígitos (DDD + telefone) -> ok
  if (digits.length === 12 || digits.length === 13) {
    if (!digits.startsWith("55")) return null;
  } else if (digits.length === 10 || digits.length === 11) {
    digits = "55" + digits;
  } else {
    return null;
  }
  // Validação final: 55 + DDD (2) + 8 ou 9 dígitos
  if (digits.length < 12 || digits.length > 13) return null;
  return digits;
}

export function formatBrazilPhone(raw: string | null | undefined): string | null {
  const n = normalizeWhatsAppPhone(raw);
  if (!n) return null;
  const ddd = n.slice(2, 4);
  const rest = n.slice(4);
  if (rest.length === 9) return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
  return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
}

export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message = "Olá! Encontrei sua empresa no Guia DF na Mídia.",
): string | null {
  const n = normalizeWhatsAppPhone(phone);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
