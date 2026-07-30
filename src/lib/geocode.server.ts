export type GeoPoint = { lat: number; lng: number };

async function tryNominatim(q: string): Promise<GeoPoint | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "GuiaDFnaMidia/1.0 (contato@guiadfnamidia.com.br)",
        },
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ lat: string; lon: string }>;
    const hit = json?.[0];
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
  } catch {
    return null;
  }
}

/** Fallback: Photon (Komoot) — não bloqueia IPs de datacenter/VPS como o Nominatim. */
async function tryPhoton(q: string): Promise<GeoPoint | null> {
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?limit=1&lang=default&q=${encodeURIComponent(`${q}, Brasil`)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
    };
    const c = json.features?.[0]?.geometry?.coordinates;
    return c && c.length === 2 ? { lat: Number(c[1]), lng: Number(c[0]) } : null;
  } catch {
    return null;
  }
}

export async function geocodeQuery(q: string): Promise<GeoPoint | null> {
  const query = q.trim();
  if (query.length < 6) return null;
  return (await tryNominatim(query)) ?? (await tryPhoton(query));
}

export type AddressHit = {
  id: string;
  primary: string;
  secondary: string;
  street: string | null;
  address_number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  formatted_address: string;
};

/** Busca de endereços (fallback quando o Google Places não está disponível). */
export async function searchAddresses(q: string): Promise<AddressHit[]> {
  const query = q.trim();
  if (query.length < 3) return [];
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?limit=6&lang=default&bbox=-49.5,-17.5,-46.0,-14.5&q=${encodeURIComponent(query)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      features?: Array<{
        geometry?: { coordinates?: [number, number] };
        properties?: Record<string, string>;
      }>;
    };
    return (json.features ?? []).map((f, i) => {
      const p = f.properties ?? {};
      const c = f.geometry?.coordinates;
      const primary = [p.name, p.housenumber].filter(Boolean).join(", ") || p.street || query;
      const secondary = [p.district, p.city, p.state, p.country].filter(Boolean).join(", ");
      return {
        id: `photon-${i}-${p.osm_id ?? primary}`,
        primary,
        secondary,
        street: p.street ?? p.name ?? null,
        address_number: p.housenumber ?? null,
        neighborhood: p.district ?? null,
        city: p.city ?? p.county ?? null,
        state: p.state ?? null,
        postal_code: p.postcode ?? null,
        country: p.countrycode ?? null,
        latitude: c ? Number(c[1]) : null,
        longitude: c ? Number(c[0]) : null,
        formatted_address: [primary, secondary].filter(Boolean).join(" - "),
      };
    });
  } catch {
    return [];
  }
}
