// Camada real (Supabase) para profissionais.
// Mantém a mesma forma de retorno `Professional` do frontend, enriquecendo
// campos que ainda não vivem no banco (portfólio, FAQs, certificações,
// regiões, agenda, tipos de atendimento) a partir dos mocks alinhados por slug.

import { supabasePublic } from "@/integrations/supabase/publicClient";
import { professionals as mockProfessionals } from "@/data/professionals";
import { resolveMediaUrlsByIds } from "@/services/adminMediaService";
import type { AttendanceType, Professional, SearchFilters } from "@/types";

type DbRow = {
  id: string;
  slug: string;
  professional_name: string | null;
  business_name: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  average_rating: number;
  reviews_count: number;
  response_time: string | null;
  starting_price: number | null;
  price_label: string | null;
  years_experience: number | null;
  is_featured: boolean;
  emergency: boolean;
  verification_status: "pending" | "approved" | "rejected";
  avatar_media_id: string | null;
  cover_media_id: string | null;
  search_tags: string[] | null;
  whatsapp: string | null;
  instagram_username: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  website_url: string | null;
  postal_code: string | null;
  street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_reference: string | null;
  location_label: string | null;
  holiday_note: string | null;
  neighborhood: string | null;

  latitude: number | null;
  longitude: number | null;
  formatted_address: string | null;
  public_address_visibility:
    | "hidden"
    | "city_state"
    | "neighborhood_city_state"
    | "full_address";
  service_radius_km: number | null;
  serves_at_business_address: boolean;
  serves_at_customer_location: boolean;
  serves_remotely: boolean;
  service_regions: string[] | null;
  initial_view_count: number | null;
  real_view_count: number | null;
  professional_services: Array<{
    starting_price: number | null;
    services: {
      id: string;
      name: string;
      categories: { slug: string; name: string } | null;
    } | null;
  }>;
};

const SELECT = `
  id, slug, professional_name, business_name, description, city, state,
  average_rating, reviews_count, response_time, starting_price, price_label, years_experience,
  is_featured, emergency, verification_status, avatar_media_id, cover_media_id,
  search_tags,
  whatsapp,
  instagram_username, instagram_url, facebook_url, website_url,
  postal_code, street, address_number, address_complement, address_reference, location_label,
  neighborhood, latitude, longitude,
  formatted_address, public_address_visibility, holiday_note,

  service_radius_km, serves_at_business_address, serves_at_customer_location, serves_remotely,
  service_regions,
  initial_view_count, real_view_count,
  professional_services(
    starting_price,
    services:service_id(
      id,
      name,
      categories:category_id(slug, name)
    )
  )
`;

const mockBySlug = new Map(mockProfessionals.map((p) => [p.slug, p]));

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function mapRow(row: DbRow, urlMap?: Map<string, string>): Professional {
  const mock = mockBySlug.get(row.slug);
  const name = row.professional_name || mock?.name || row.slug;
  const services =
    row.professional_services
      ?.map((ps) =>
        ps.services
          ? {
              id: ps.services.id,
              name: ps.services.name,
              priceFrom: Number(ps.starting_price ?? 0),
              categorySlug: ps.services.categories?.slug,
              categoryName: ps.services.categories?.name,
            }
          : null,
      )
      .filter((v): v is NonNullable<typeof v> => v !== null) ?? [];


  const categorySlug =
    row.professional_services?.find((ps) => ps.services?.categories?.slug)?.services
      ?.categories?.slug ||
    mock?.categorySlug ||
    "";

  const specialty =
    mock?.specialty ||
    row.professional_services?.find((ps) => ps.services?.categories?.name)?.services
      ?.categories?.name ||
    "Prestador de serviços";

  const avatarUrl = row.avatar_media_id ? urlMap?.get(row.avatar_media_id) ?? null : null;
  const coverUrl = row.cover_media_id ? urlMap?.get(row.cover_media_id) ?? null : null;

  return {
    id: row.id,
    slug: row.slug,
    name,
    company: row.business_name ?? mock?.company,
    initials: mock?.initials || initialsOf(name),
    avatarColor: mock?.avatarColor || "bg-primary",
    avatarUrl,
    coverUrl,
    specialty,
    categorySlug,
    verified: row.verification_status === "approved",
    featured: row.is_featured,
    sponsored: mock?.sponsored,
    badge: mock?.badge,
    rating: Number(row.average_rating ?? 0),
    reviewsCount: row.reviews_count ?? 0,
    city: row.city ?? "",
    state: row.state ?? "",
    distanceKm: 0,
    responseTime: row.response_time ?? mock?.responseTime ?? "—",
    responseMinutes: mock?.responseMinutes ?? 60,
    priceFrom: Number(row.starting_price ?? mock?.priceFrom ?? 0),
    priceLabel: row.price_label ?? null,
    experienceYears: row.years_experience ?? mock?.experienceYears ?? 0,
    description: row.description ?? mock?.description ?? "",
    services: (services.length ? services : mock?.services ?? []) as Professional["services"],
    regions: (row.service_regions?.length ? row.service_regions : mock?.regions) ?? [],
    certifications: mock?.certifications ?? [],
    schedule: mock?.schedule ?? "Seg a Sáb, 8h às 18h",
    attendanceTypes: (mock?.attendanceTypes ?? ["residencial"]) as AttendanceType[],
    emergency: row.emergency,
    portfolio: mock?.portfolio ?? [],
    faqs: mock?.faqs ?? [],
    searchTags: row.search_tags ?? mock?.searchTags ?? [],
    whatsapp: row.whatsapp ?? null,
    social: {
      instagram: row.instagram_username,
      instagramUrl: row.instagram_url,
      facebook: row.facebook_url,
      website: row.website_url,
    },
    address: {
      visibility: row.public_address_visibility ?? "city_state",
      city: row.city,
      state: row.state,
      neighborhood: row.neighborhood,
      street: row.street,
      number: row.address_number,
      complement: row.address_complement,
      reference: row.address_reference,
      locationLabel: row.location_label,
      postalCode: row.postal_code,
      formatted: row.formatted_address,
      latitude: row.latitude,
      longitude: row.longitude,
      serviceRadiusKm: row.service_radius_km,
      servesAtBusiness: Boolean(row.serves_at_business_address),
      servesAtCustomer: Boolean(row.serves_at_customer_location),
      servesRemotely: Boolean(row.serves_remotely),
    },
    holidayNote: row.holiday_note,
    viewsTotal: Number(row.initial_view_count ?? 0) + Number(row.real_view_count ?? 0),
  };
}

async function resolveRowMedia(rows: DbRow[]): Promise<Map<string, string>> {
  const ids: (string | null)[] = [];
  rows.forEach((r) => {
    ids.push(r.avatar_media_id, r.cover_media_id);
  });
  return resolveMediaUrlsByIds(ids);
}

async function fetchAll(): Promise<Professional[]> {
  const { data, error } = await supabasePublic
    .from("professional_profiles")
    .select(SELECT)
    .eq("profile_status", "published")
    .order("is_featured", { ascending: false })
    .order("average_rating", { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as unknown as DbRow[];
  const urlMap = await resolveRowMedia(rows);
  return rows.map((r) => mapRow(r, urlMap));
}

export async function listProfessionals(): Promise<Professional[]> {
  return fetchAll();
}

export async function listFeaturedProfessionals(limit = 4): Promise<Professional[]> {
  const all = await fetchAll();
  return all.filter((p) => p.featured).slice(0, limit);
}


export async function getProfessionalBySlug(
  slug: string,
): Promise<Professional | undefined> {
  const { data, error } = await supabasePublic
    .from("professional_profiles")
    .select(SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const row = data as unknown as DbRow;
  const urlMap = await resolveRowMedia([row]);
  return mapRow(row, urlMap);
}

export async function listProfessionalsByCategory(
  categorySlug: string,
): Promise<Professional[]> {
  const all = await fetchAll();
  return all.filter(
    (p) =>
      p.categorySlug === categorySlug ||
      p.services?.some((s) => s.categorySlug === categorySlug),
  );
}

export async function listRelatedProfessionals(slug: string): Promise<Professional[]> {
  const current = await getProfessionalBySlug(slug);
  if (!current) return [];
  const all = await fetchAll();
  return all
    .filter(
      (p) =>
        p.slug !== slug &&
        (p.categorySlug === current.categorySlug ||
          p.services?.some((s) => s.categorySlug === current.categorySlug)),
    )
    .slice(0, 3);
}

const norm = (s: string) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "a", "o", "as", "os", "para", "por",
  "com", "um", "uma", "no", "na", "perto", "mim", "aqui",
]);

function tokenize(q: string): string[] {
  return norm(q)
    .split(" ")
    .map((t) => t.replace(/^#/, ""))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Texto pesquisável do que o profissional FAZ (sem localização, para não poluir o match). */
function haystack(p: Professional): string {
  return norm(
    [
      p.name,
      p.company ?? "",
      p.specialty,
      p.categorySlug,
      p.description ?? "",
      ...(p.searchTags ?? []),
      ...(p.services ?? []).map((s) => `${s.name} ${s.categoryName ?? ""} ${s.categorySlug ?? ""}`),
    ].join(" "),
  );
}

/** Texto de localização real do profissional (endereço cadastrado). */
function locationHaystack(p: Professional): string {
  return norm(
    [
      p.city,
      p.state,
      p.address?.neighborhood ?? "",
      p.address?.locationLabel ?? "",
      p.address?.postalCode ?? "",
      p.address?.formatted ?? "",
    ].join(" "),
  );
}

/** Verifica se um termo aparece como palavra (e não apenas como pedaço de outra). */
function hasWord(text: string, token: string): boolean {
  return new RegExp(`(^| )${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(text);
}

/** Pontuação de relevância — quanto maior, melhor o match. */
function scoreProfessional(p: Professional, tokens: string[]): number {
  if (!tokens.length) return 0;
  const hay = haystack(p);
  const name = norm(`${p.name} ${p.company ?? ""} ${p.specialty ?? ""}`);
  const tags = (p.searchTags ?? []).map(norm);
  const services = (p.services ?? []).map((s) => norm(`${s.name} ${s.categoryName ?? ""}`));
  const category = norm(p.categorySlug ?? "");

  let score = 0;
  for (const t of tokens) {
    let tokenScore = 0;
    if (name.startsWith(t)) tokenScore = 100;
    else if (hasWord(name, t)) tokenScore = 70;
    if (tags.some((tag) => tag === t)) tokenScore = Math.max(tokenScore, 90);
    else if (tags.some((tag) => hasWord(tag, t))) tokenScore = Math.max(tokenScore, 60);
    if (services.some((s) => hasWord(s, t))) tokenScore = Math.max(tokenScore, 50);
    if (hasWord(category, t)) tokenScore = Math.max(tokenScore, 45);
    if (!tokenScore && hasWord(hay, t)) tokenScore = 20; // descrição
    if (!tokenScore) return 0; // todos os termos precisam existir em algum campo
    score += tokenScore;
  }
  // pequenos desempates
  score += Math.min(p.rating ?? 0, 5) * 2 + (p.verified ? 3 : 0) + (p.featured ? 2 : 0);
  return score;
}


export async function searchProfessionals(
  filters: SearchFilters,
): Promise<Professional[]> {
  let result = await fetchAll();

  const tokens = filters.servico ? tokenize(filters.servico) : [];
  let scores: Map<string, number> | null = null;
  if (tokens.length) {
    scores = new Map();
    result = result.filter((p) => {
      const s = scoreProfessional(p, tokens);
      if (s > 0) scores!.set(p.id, s);
      return s > 0;
    });
  }
  if (filters.cidade) {
    const cityTokens = tokenize(filters.cidade);
    if (cityTokens.length) {
      result = result.filter((p) => {
        // apenas o endereço real cadastrado — áreas de atendimento não valem como localização
        const local = locationHaystack(p);
        return cityTokens.every((t) => local.includes(t));
      });
    }
  }

  if (filters.categoria && filters.categoria !== "todas") {
    result = result.filter(
      (p) =>
        p.categorySlug === filters.categoria ||
        p.services?.some((s) => s.categorySlug === filters.categoria),
    );
  }
  if (filters.notaMinima) {
    result = result.filter((p) => p.rating >= filters.notaMinima!);
  }
  if (filters.distancia) {
    result = result.filter((p) => p.distanceKm <= filters.distancia!);
  }
  if (filters.atendimento && filters.atendimento !== "todos") {
    result = result.filter((p) =>
      p.attendanceTypes.includes(filters.atendimento as AttendanceType),
    );
  }
  if (filters.verificado) {
    result = result.filter((p) => p.verified);
  }
  if (filters.precoMax) {
    result = result.filter((p) => p.priceFrom <= filters.precoMax!);
  }
  if (filters.emergencial) {
    result = result.filter((p) => p.emergency);
  }

  switch (filters.ordenar) {
    case "avaliacao":
      result.sort((a, b) => b.rating - a.rating);
      break;
    case "proximidade":
      result.sort((a, b) => a.distanceKm - b.distanceKm);
      break;
    case "resposta":
      result.sort((a, b) => a.responseMinutes - b.responseMinutes);
      break;
    case "preco":
      result.sort((a, b) => a.priceFrom - b.priceFrom);
      break;
    case "recentes":
      result.sort((a, b) => a.experienceYears - b.experienceYears);
      break;
    default:
      result.sort(
        (a, b) =>
          (scores ? (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) : 0) ||
          Number(b.sponsored ?? false) - Number(a.sponsored ?? false) ||
          b.rating - a.rating,
      );
  }
  return result;
}

export type PublicReview = {
  id: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  createdAt: string;
};

export async function listApprovedReviewsBySlug(
  slug: string,
  limit = 30,
): Promise<PublicReview[]> {
  const { data: pro, error: pErr } = await supabasePublic
    .from("professional_profiles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!pro?.id) return [];
  return listApprovedReviewsByPro(pro.id as string, limit);
}


export async function listApprovedReviewsByPro(
  proId: string,
  limit = 30,
): Promise<PublicReview[]> {
  const { data, error } = await supabasePublic
    .from("reviews")
    .select("id, rating, comment, professional_reply, created_at")
    .eq("professional_id", proId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    rating: r.rating as number,
    comment: (r.comment as string | null) ?? null,
    reply: (r.professional_reply as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}

// ---------------------------------------------------------------------------
// Sugestões inteligentes de busca (lojas, hashtags, serviços e categorias)
// ---------------------------------------------------------------------------

export type SearchSuggestion = {
  kind: "profissional" | "tag" | "servico" | "categoria";
  label: string;
  sublabel?: string;
  /** termo aplicado na busca */
  term: string;
  /** quando existir, permite ir direto à ficha da loja */
  slug?: string;
  categorySlug?: string;
};

export async function listSearchSuggestions(
  query: string,
  limit = 8,
): Promise<SearchSuggestion[]> {
  const tokens = tokenize(query);
  if (!tokens.length) return [];

  const pros = await fetchAll();

  const scored = pros
    .map((p) => ({ p, score: scoreProfessional(p, tokens) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const out: SearchSuggestion[] = scored.slice(0, 5).map(({ p }) => ({
    kind: "profissional" as const,
    label: p.company || p.name,
    sublabel: [p.specialty, [p.city, p.state].filter(Boolean).join("/")]
      .filter(Boolean)
      .join(" · "),
    term: p.company || p.name,
    slug: p.slug,
  }));

  const seen = new Set(out.map((s) => norm(s.label)));

  // hashtags cadastradas pelo admin
  const tagCount = new Map<string, number>();
  for (const p of pros) {
    for (const tag of p.searchTags ?? []) {
      const n = norm(tag);
      if (!n || !tokens.some((t) => n.includes(t))) continue;
      tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
    }
  }
  for (const [tag, count] of [...tagCount.entries()].sort((a, b) => b[1] - a[1])) {
    if (out.length >= limit) break;
    if (seen.has(norm(tag))) continue;
    seen.add(norm(tag));
    out.push({
      kind: "tag",
      label: `#${tag.replace(/^#/, "")}`,
      sublabel: `${count} ${count === 1 ? "loja" : "lojas"}`,
      term: tag.replace(/^#/, ""),
    });
  }

  // serviços e categorias cadastrados
  for (const p of pros) {
    if (out.length >= limit) break;
    for (const s of p.services ?? []) {
      if (out.length >= limit) break;
      const n = norm(s.name);
      if (!n || seen.has(n) || !tokens.some((t) => n.includes(t))) continue;
      seen.add(n);
      out.push({
        kind: "servico",
        label: s.name,
        sublabel: s.categoryName ?? "Serviço",
        term: s.name,
        categorySlug: s.categorySlug,
      });
    }
  }

  return out.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Localizações reais cadastradas (cidades, regiões e bairros)
// ---------------------------------------------------------------------------

export type LocationSuggestion = {
  kind: "cidade" | "regiao" | "bairro";
  label: string;
  term: string;
  count: number;
};

/**
 * Lista cidades/regiões/bairros existentes nos cadastros publicados.
 * Sem query, devolve os locais com mais lojas.
 */
export async function listLocationSuggestions(
  query = "",
  limit = 8,
): Promise<LocationSuggestion[]> {
  const pros = await fetchAll();
  const tokens = tokenize(query);

  type Bucket = { kind: LocationSuggestion["kind"]; label: string; count: number };
  const buckets = new Map<string, Bucket>();

  const add = (kind: Bucket["kind"], raw?: string | null) => {
    const label = (raw ?? "").trim();
    if (!label) return;
    const key = `${kind}:${norm(label)}`;
    const current = buckets.get(key);
    if (current) current.count += 1;
    else buckets.set(key, { kind, label, count: 1 });
  };

  for (const p of pros) {
    const city = p.city?.trim();
    if (city) add("cidade", p.state ? `${city}/${p.state}` : city);
    for (const region of p.regions ?? []) add("regiao", region);
    add("bairro", p.address?.neighborhood ?? null);
  }

  let list = [...buckets.values()];
  if (tokens.length) {
    list = list.filter((b) => {
      const n = norm(b.label);
      return tokens.every((t) => n.includes(t));
    });
  }

  return list
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"))
    .slice(0, limit)
    .map((b) => ({ kind: b.kind, label: b.label, term: b.label, count: b.count }));
}

/** Encontra a cidade/região cadastrada mais próxima de uma coordenada. */
export async function findNearestLocation(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const pros = await fetchAll();
  const toRad = (v: number) => (v * Math.PI) / 180;
  let best: { label: string; dist: number } | null = null;

  for (const p of pros) {
    const lat = p.address?.latitude;
    const lng = p.address?.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    const dLat = toRad(lat - latitude);
    const dLng = toRad(lng - longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(latitude)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
    const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const label =
      p.address?.neighborhood?.trim() ||
      (p.city ? (p.state ? `${p.city}/${p.state}` : p.city) : "");
    if (!label) continue;
    if (!best || dist < best.dist) best = { label, dist };
  }

  return best?.label ?? null;
}
