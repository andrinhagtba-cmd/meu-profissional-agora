// Camada de serviços — profissionais/categorias vêm do Supabase (professionalService/categoryService);
// reviews, quotes, plans, blog seguem mockados até etapas futuras.

import { categories } from "@/data/categories";
import { reviews } from "@/data/reviews";
import { quoteRequests } from "@/data/quoteRequests";
import { plans } from "@/data/plans";
import { blogPosts } from "@/data/blogPosts";
import type { Category, Professional, QuoteRequest, Review, SearchFilters } from "@/types";
import * as proSvc from "@/services/professionalService";

const DELAY = 300;

function delay<T>(data: T, ms = DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export function getCategories(): Promise<Category[]> {
  return delay(categories);
}

export function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return delay(categories.find((c) => c.slug === slug));
}

// Profissionais — dados reais do Supabase (com enriquecimento por slug do mock)
export function getProfessionals(): Promise<Professional[]> {
  return proSvc.listProfessionals();
}

export function getFeaturedProfessionals(limit?: number): Promise<Professional[]> {
  return proSvc.listFeaturedProfessionals(limit);
}


export function getProfessionalBySlug(slug: string): Promise<Professional | undefined> {
  return proSvc.getProfessionalBySlug(slug);
}

export function getProfessionalsByCategory(categorySlug: string): Promise<Professional[]> {
  return proSvc.listProfessionalsByCategory(categorySlug);
}

export function getRelatedProfessionals(slug: string): Promise<Professional[]> {
  return proSvc.listRelatedProfessionals(slug);
}

export function searchProfessionals(filters: SearchFilters): Promise<Professional[]> {
  return proSvc.searchProfessionals(filters);
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

// Simulações mantidas até as etapas de orçamentos/leads
export function submitProposal(_data: { message: string; value: string; deadline: string }) {
  return delay({ ok: true }, 400);
}

export function submitQuoteRequest(_data: Record<string, unknown>) {
  return delay({ ok: true, protocol: `OR-${Math.floor(100000 + Math.random() * 900000)}` }, 500);
}

export function registerWhatsAppLead(professionalSlug: string, service?: string) {
  console.info("[lead] clique de WhatsApp:", { professionalSlug, service });
  return delay({ ok: true }, 100);
}

