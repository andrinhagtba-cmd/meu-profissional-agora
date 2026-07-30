import { createServerFn } from "@tanstack/react-start";
import { geocodeQuery, searchAddresses } from "./geocode.server";

/**
 * Geocodificação server-side (Nominatim + fallback Photon).
 * Feita no servidor porque o Nominatim bloqueia/limita chamadas diretas do navegador
 * e IPs de VPS — o fallback garante funcionamento em domínio próprio.
 */
export const geocodeAddressFn = createServerFn({ method: "GET" })
  .inputValidator((data: { q: string }) => ({ q: String(data?.q ?? "").slice(0, 300) }))
  .handler(async ({ data }) => geocodeQuery(data.q));

/** Sugestões de endereço (fallback server-side quando o Google Places falha). */
export const searchAddressesFn = createServerFn({ method: "GET" })
  .inputValidator((data: { q: string }) => ({ q: String(data?.q ?? "").slice(0, 200) }))
  .handler(async ({ data }) => searchAddresses(data.q));
