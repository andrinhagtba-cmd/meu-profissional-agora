// Camada de serviços mockados — substituir por integração real na fase de backend.
// Todas as funções retornam Promises com atraso simulado para permitir skeletons.

import { categories } from "@/data/categories";
import { professionals } from "@/data/professionals";
import { reviews } from "@/data/reviews";
import { quoteRequests } from "@/data/quoteRequests";
import { plans } from "@/data/plans";
import { blogPosts } from "@/data/blogPosts";
import type { Category, Professional, QuoteRequest, Review, SearchFilters } from "@/types";

const DELAY = 450;

function delay<T>(data: T, ms = DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export function getCategories(): Promise<Category[]> {
  return delay(categories);
}

export function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return delay(categories.find((c) => c.slug === slug));
}

export function getProfessionals(): Promise<Professional[]> {
  return delay(professionals);
}

export function getFeaturedProfessionals(): Promise<Professional[]> {
  return delay(professionals.filter((p) => p.featured).slice(0, 4));
}

export function getProfessionalBySlug(slug: string): Promise<Professional | undefined> {
  return delay(professionals.find((p) => p.slug === slug));
}

export function getProfessionalsByCategory(categorySlug: string): Promise<Professional[]> {
  return delay(professionals.filter((p) => p.categorySlug === categorySlug));
}

export function getRelatedProfessionals(slug: string): Promise<Professional[]> {
  const current = professionals.find((p) => p.slug === slug);
  if (!current) return delay([]);
  return delay(
    professionals.filter((p) => p.categorySlug === current.categorySlug && p.slug !== slug).slice(0, 3),
  );
}

export function getReviewsForProfessional(slug: string): Promise<Review[]> {
  return delay(reviews.filter((r) => r.professionalSlug === slug));
}

export function getAllReviews(): Promise<Review[]> {
  return delay(reviews);
}

export function getQuoteRequests(): Promise<QuoteRequest[]> {
  return delay(quoteRequests);
}

export function getPlans() {
  return delay(plans);
}

export function getBlogPosts() {
  return delay(blogPosts);
}

export function getBlogPostBySlug(slug: string) {
  return delay(blogPosts.find((p) => p.slug === slug));
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function searchProfessionals(filters: SearchFilters): Promise<Professional[]> {
  let result = [...professionals];

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
    result = result.filter((p) => p.attendanceTypes.includes(filters.atendimento as never));
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
      // relevância: patrocinados primeiro, depois nota
      result.sort((a, b) => Number(b.sponsored ?? false) - Number(a.sponsored ?? false) || b.rating - a.rating);
  }

  return delay(result, 600);
}

// Simula o envio de uma proposta / solicitação — apenas frontend nesta fase.
export function submitProposal(_data: { message: string; value: string; deadline: string }) {
  return delay({ ok: true }, 700);
}

export function submitQuoteRequest(_data: Record<string, unknown>) {
  return delay({ ok: true, protocol: `OR-${Math.floor(100000 + Math.random() * 900000)}` }, 900);
}

// Registra o clique de WhatsApp como lead (apenas console nesta fase).
export function registerWhatsAppLead(professionalSlug: string, service?: string) {
  console.info("[mock lead] clique de WhatsApp registrado:", { professionalSlug, service });
  return delay({ ok: true }, 200);
}
