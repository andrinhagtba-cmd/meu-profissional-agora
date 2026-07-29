import { createServerFn } from "@tanstack/react-start";

/**
 * Geocodificação server-side (Nominatim/OpenStreetMap).
 * Feita no servidor porque o Nominatim bloqueia/limita chamadas diretas do navegador
 * em domínios próprios (VPS/custom domain) — no preview funcionava, em produção não.
 */
export const geocodeAddressFn = createServerFn({ method: "GET" })
  .inputValidator((data: { q: string }) => ({ q: String(data?.q ?? "").slice(0, 300) }))
  .handler(async ({ data }) => {
    const q = data.q.trim();
    if (q.length < 6) return null;
    return (await tryNominatim(q)) ?? (await tryPhoton(q));
  });

async function tryNominatim(q: string) {
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
async function tryPhoton(q: string) {
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?limit=1&lang=default&q=${encodeURIComponent(q + ", Brasil")}`,
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
