// Tipos do domínio — substituir por tipos gerados do backend na fase de integração.

export interface CategoryFaq {
  question: string;
  answer: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  imageKey: string;
  professionalsCount: number;
  rating: number;
  priceFrom: number;
  badge?: string;
  description: string;
  services: string[];
  faqs: CategoryFaq[];
}

export interface ProfessionalService {
  name: string;
  priceFrom: number;
}

export interface Professional {
  id: string;
  slug: string;
  name: string;
  company?: string;
  initials: string;
  avatarColor: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  specialty: string;
  categorySlug: string;
  verified: boolean;
  sponsored?: boolean;
  featured?: boolean;
  badge?: string;
  rating: number;
  reviewsCount: number;
  city: string;
  state: string;
  distanceKm: number;
  responseTime: string;
  responseMinutes: number;
  priceFrom: number;
  experienceYears: number;
  description: string;
  services: ProfessionalService[];
  regions: string[];
  certifications: string[];
  schedule: string;
  attendanceTypes: AttendanceType[];
  emergency: boolean;
  portfolio: string[];
  faqs: CategoryFaq[];
}

export type AttendanceType = "residencial" | "empresarial" | "online";

export interface Review {
  id: string;
  professionalSlug: string;
  author: string;
  city: string;
  rating: number;
  text: string;
  service: string;
  date: string;
}

export type Urgency = "hoje" | "esta-semana" | "data" | "sem-urgencia";

export interface QuoteRequest {
  id: string;
  category: string;
  categorySlug: string;
  city: string;
  state: string;
  date: string;
  urgency: Urgency;
  description: string;
  proposals: number;
  status: "aberta" | "em-andamento" | "concluida";
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  imageKey: string;
  author: string;
  content: string[];
}

export type UserRole = "cliente" | "profissional" | "admin";

export interface MockUser {
  name: string;
  email: string;
  role: UserRole;
}

export interface SearchFilters {
  servico?: string;
  cidade?: string;
  categoria?: string;
  notaMinima?: number;
  distancia?: number;
  atendimento?: string;
  verificado?: boolean;
  precoMax?: number;
  emergencial?: boolean;
  disponibilidade?: string;
  ordenar?: string;
}
