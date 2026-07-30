// Utilitários compartilhados: normalização de redes sociais e privacidade de endereço.

export type AddressVisibility =
  | "hidden"
  | "city_state"
  | "neighborhood_city_state"
  | "full_address";

export const ADDRESS_VISIBILITY_LABEL: Record<AddressVisibility, string> = {
  hidden: "Oculto",
  city_state: "Cidade e UF",
  neighborhood_city_state: "Bairro, cidade e UF",
  full_address: "Endereço completo",
};

export function normalizeInstagramHandle(input: string | null | undefined): {
  handle: string | null;
  url: string | null;
} {
  if (!input) return { handle: null, url: null };
  let v = input.trim();
  if (!v) return { handle: null, url: null };
  try {
    if (/^https?:\/\//i.test(v)) {
      const u = new URL(v);
      v = u.pathname.replace(/^\/+|\/+$/g, "").split("/")[0] ?? "";
    }
  } catch {
    /* noop */
  }
  v = v.replace(/^@+/, "").replace(/[^a-zA-Z0-9._]/g, "");
  if (!v) return { handle: null, url: null };
  return { handle: v, url: `https://instagram.com/${v}` };
}

export function normalizeUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const v = input.trim();
  if (!v) return null;
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    return new URL(withProto).toString();
  } catch {
    return null;
  }
}

export function normalizeWhatsapp(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D+/g, "");
  return digits || null;
}

export interface PublicAddressInput {
  visibility: AddressVisibility | null | undefined;
  city: string | null | undefined;
  state: string | null | undefined;
  neighborhood: string | null | undefined;
  street: string | null | undefined;
  address_number: string | null | undefined;
  address_complement?: string | null | undefined;
  address_reference?: string | null | undefined;
  postal_code: string | null | undefined;
  formatted_address: string | null | undefined;
}

export interface ProfessionalLocationInput {
  city?: string | null;
  state?: string | null;
  address?: {
    visibility: AddressVisibility | null | undefined;
    city: string | null | undefined;
    state: string | null | undefined;
    neighborhood: string | null | undefined;
    street: string | null | undefined;
    number: string | null | undefined;
    complement?: string | null | undefined;
    reference?: string | null | undefined;
    locationLabel?: string | null | undefined;
    postalCode: string | null | undefined;
    formatted: string | null | undefined;
  };
}

/** Monta o endereço completo estruturado: Logradouro, Nº, Complemento — Bairro — RA/UF — CEP. */
export function fullAddressLine(a: PublicAddressInput): string | null {
  const line = [a.street, a.address_number, a.address_complement].filter(Boolean).join(", ");
  const cityState = [a.city, a.state].filter(Boolean).join(", ");
  const cep = a.postal_code ? `CEP ${a.postal_code}` : null;
  return [line, a.neighborhood, cityState, cep].filter(Boolean).join(" · ") || null;
}

export function publicAddressLabel(a: PublicAddressInput): string | null {
  const vis = (a.visibility as AddressVisibility) ?? "city_state";
  if (vis === "hidden") return null;
  const cityState = [a.city, a.state].filter(Boolean).join(", ");
  if (vis === "city_state") return cityState || null;
  if (vis === "neighborhood_city_state") {
    // Quando o bairro não foi preenchido, usa o logradouro/número como detalhe
    const detail =
      a.neighborhood?.trim() ||
      [a.street, a.address_number].filter(Boolean).join(", ") ||
      null;
    return [detail, cityState].filter(Boolean).join(" · ") || null;
  }
  // full_address — prioriza os campos estruturados para não perder o complemento
  return fullAddressLine(a) ?? a.formatted_address ?? null;
}

/** Rótulo público único para cards e detalhe: local personalizado > endereço completo > visibilidade > cidade/UF. */
export function professionalPublicLocationLabel(pro: ProfessionalLocationInput): string | null {
  const a = pro.address;
  if (!a) return [pro.city, pro.state].filter(Boolean).join(", ") || null;
  if (a.visibility === "hidden") return null;
  const customLabel = a.locationLabel?.trim();
  if (customLabel) return customLabel;

  const input: PublicAddressInput = {
    visibility: a.visibility,
    city: a.city ?? pro.city ?? null,
    state: a.state ?? pro.state ?? null,
    neighborhood: a.neighborhood,
    street: a.street,
    address_number: a.number,
    address_complement: a.complement,
    address_reference: a.reference,
    postal_code: a.postalCode,
    formatted_address: a.formatted,
  };

  const cityState = [pro.city, pro.state].filter(Boolean).join(", ");
  return fullAddressLine({ ...input, visibility: "full_address" }) ?? input.formatted_address ?? publicAddressLabel(input) ?? (cityState || null);
}



export function mapsSearchUrl(a: PublicAddressInput): string | null {
  const label = publicAddressLabel({ ...a, visibility: "full_address" });
  if (!label) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`;
}

/** Endereço completo (uso interno/admin): rua, nº, complemento, bairro, RA/UF. */
export function adminProLocationLabel(p: {
  street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  formatted_address?: string | null;
}): string {
  const line1 = [p.street, p.address_number].filter(Boolean).join(", ");
  const parts = [
    line1 || null,
    p.address_complement || null,
    p.neighborhood || null,
    p.city ? `${p.city}${p.state ? `/${p.state}` : ""}` : null,
  ].filter(Boolean) as string[];
  if (parts.length) return parts.join(" · ");
  if (p.formatted_address) return p.formatted_address;
  return "Sem localização";
}

/** Partes do endereço público para exibição premium em cards: linha principal + complementar. */
export function professionalPublicLocationParts(pro: ProfessionalLocationInput): {
  primary: string;
  secondary: string | null;
} | null {
  const a = pro.address;
  if (a?.visibility === "hidden") return null;
  const cityState = [a?.city ?? pro.city, a?.state ?? pro.state].filter(Boolean).join(", ");
  const custom = a?.locationLabel?.trim();
  if (custom) {
    const rest = [a?.street && [a.street, a.number].filter(Boolean).join(", "), a?.neighborhood, cityState]
      .filter(Boolean)
      .join(" · ");
    return { primary: custom, secondary: rest || null };
  }
  const street = [a?.street, a?.number].filter(Boolean).join(", ");
  const primary = street || a?.neighborhood || a?.formatted || cityState;
  if (!primary) return null;
  const secondary =
    [street ? a?.complement : null, street ? a?.neighborhood : null, cityState]
      .filter(Boolean)
      .join(" · ") || null;
  return { primary, secondary: secondary === primary ? null : secondary };
}
