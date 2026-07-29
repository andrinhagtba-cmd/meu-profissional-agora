import { createServerFn } from "@tanstack/react-start";
import { geocodeQuery } from "./geocode.server";

/**
 * Geocodificação server-side (Nominatim + fallback Photon).
 * Feita no servidor porque o Nominatim bloqueia/limita chamadas diretas do navegador
 * e IPs de VPS — o fallback garante funcionamento em domínio próprio.
 */
export const geocodeAddressFn = createServerFn({ method: "GET" })
  .inputValidator((data: { q: string }) => ({ q: String(data?.q ?? "").slice(0, 300) }))
  .handler(async ({ data }) => geocodeQuery(data.q));
