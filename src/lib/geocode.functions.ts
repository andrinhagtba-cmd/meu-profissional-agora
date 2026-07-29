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
  });
