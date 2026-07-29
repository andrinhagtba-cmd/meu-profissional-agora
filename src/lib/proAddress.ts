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
    return [a.neighborhood, cityState].filter(Boolean).join(" · ") || null;
  }
  // full_address — prioriza os campos estruturados para não perder o complemento
  return fullAddressLine(a) ?? a.formatted_address ?? null;
}


export function mapsSearchUrl(a: PublicAddressInput): string | null {
  const label = publicAddressLabel({ ...a, visibility: "full_address" });
  if (!label) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`;
}
