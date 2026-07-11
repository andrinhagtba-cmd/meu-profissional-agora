// Camada real (Supabase) para profissionais.
// Mantém a mesma forma de retorno `Professional` do frontend, enriquecendo
// campos que ainda não vivem no banco (portfólio, FAQs, certificações,
// regiões, agenda, tipos de atendimento) a partir dos mocks alinhados por slug.

import { supabase } from "@/integrations/supabase/client";
import { professionals as mockProfessionals } from "@/data/professionals";
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
  years_experience: number | null;
  is_featured: boolean;
  emergency: boolean;
  verification_status: "pending" | "approved" | "rejected";
  professional_services: Array<{
    starting_price: number | null;
    services: {
      name: string;
      categories: { slug: string; name: string } | null;
    } | null;
  }>;
};

const SELECT = `
  id, slug, professional_name, business_name, description, city, state,
  average_rating, reviews_count, response_time, starting_price, years_experience,
  is_featured, emergency, verification_status,
  professional_services(
    starting_price,
    services:service_id(
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

function mapRow(row: DbRow): Professional {
  const mock = mockBySlug.get(row.slug);
  const name = row.professional_name || mock?.name || row.slug;
  const services =
    row.professional_services
      ?.map((ps) =>
        ps.services
          ? { name: ps.services.name, priceFrom: Number(ps.starting_price ?? 0) }
          : null,
      )
      .filter((v): v is { name: string; priceFrom: number } => v !== null) ?? [];

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

  return {
    id: row.id,
    slug: row.slug,
    name,
    company: row.business_name ?? mock?.company,
    initials: mock?.initials || initialsOf(name),
    avatarColor: mock?.avatarColor || "bg-primary",
    specialty,
    categorySlug,
    verified: row.verification_status === "approved",
    featured: row.is_featured,
    sponsored: mock?.sponsored,
    badge: mock?.badge,
    rating: Number(row.average_rating ?? 0),
    reviewsCount: row.reviews_count ?? 0,
    city: row.city ?? mock?.city ?? "",
    state: row.state ?? mock?.state ?? "",
    distanceKm: mock?.distanceKm ?? 0,
    responseTime: row.response_time ?? mock?.responseTime ?? "—",
    responseMinutes: mock?.responseMinutes ?? 60,
    priceFrom: Number(row.starting_price ?? mock?.priceFrom ?? 0),
    experienceYears: row.years_experience ?? mock?.experienceYears ?? 0,
    description: row.description ?? mock?.description ?? "",
    services: services.length ? services : mock?.services ?? [],
    regions: mock?.regions ?? [],
    certifications: mock?.certifications ?? [],
    schedule: mock?.schedule ?? "Seg a Sáb, 8h às 18h",
    attendanceTypes: (mock?.attendanceTypes ?? ["residencial"]) as AttendanceType[],
    emergency: row.emergency,
    portfolio: mock?.portfolio ?? [],
    faqs: mock?.faqs ?? [],
  };
}

async function fetchAll(): Promise<Professional[]> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select(SELECT)
    .eq("profile_status", "published")
    .order("is_featured", { ascending: false })
    .order("average_rating", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as unknown as DbRow[]).map(mapRow);
}

export async function listProfessionals(): Promise<Professional[]> {
  return fetchAll();
}

export async function listFeaturedProfessionals(): Promise<Professional[]> {
  const all = await fetchAll();
  return all.filter((p) => p.featured).slice(0, 4);
}

export async function getProfessionalBySlug(
  slug: string,
): Promise<Professional | undefined> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select(SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return mapRow(data as unknown as DbRow);
}

export async function listProfessionalsByCategory(
  categorySlug: string,
): Promise<Professional[]> {
  const all = await fetchAll();
  return all.filter((p) => p.categorySlug === categorySlug);
}

export async function listRelatedProfessionals(slug: string): Promise<Professional[]> {
  const current = await getProfessionalBySlug(slug);
  if (!current) return [];
  const all = await fetchAll();
  return all
    .filter((p) => p.categorySlug === current.categorySlug && p.slug !== slug)
    .slice(0, 3);
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export async function searchProfessionals(
  filters: SearchFilters,
): Promise<Professional[]> {
  let result = await fetchAll();

  if (filters.servico) {
    const q = norm(filters.servico);
    result = result.filter(
      (p) =>
        norm(p.specialty).includes(q) ||
        norm(p.name).includes(q) ||
        norm(p.categorySlug).includes(q) ||
        p.services.some((s) => norm(s.name).includes(q)),
    );
  }
  if (filters.cidade) {
    const q = norm(filters.cidade);
    result = result.filter((p) => norm(p.city).includes(q) || norm(p.state).includes(q));
  }
  if (filters.categoria && filters.categoria !== "todas") {
    result = result.filter((p) => p.categorySlug === filters.categoria);
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
  const { data: pro, error: pErr } = await supabase
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
  const { data, error } = await supabase
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
