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
