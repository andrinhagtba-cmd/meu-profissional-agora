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
  id?: string;
  name: string;
  priceFrom: number;
  categorySlug?: string;
  categoryName?: string;
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
  responseMinutes: number;
  responseTime: string;
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
  searchTags?: string[];
  whatsapp?: string | null;
  social?: {
    instagram?: string | null;
    instagramUrl?: string | null;
    facebook?: string | null;
    website?: string | null;
  };
  address?: {
    visibility: "hidden" | "city_state" | "neighborhood_city_state" | "full_address";
    city: string | null;
    state: string | null;
    neighborhood: string | null;
    street: string | null;
    number: string | null;
    complement?: string | null;
    reference?: string | null;
    locationLabel?: string | null;
    postalCode: string | null;
    formatted: string | null;
    latitude: number | null;
    longitude: number | null;
    serviceRadiusKm: number | null;
    servesAtBusiness: boolean;
    servesAtCustomer: boolean;
    servesRemotely: boolean;
  };
  holidayNote?: string | null;
  viewsTotal?: number;
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
