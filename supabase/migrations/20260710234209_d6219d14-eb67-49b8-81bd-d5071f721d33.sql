
-- =========================================================
-- ETAPA 1 — ProConecta: schema completo, RLS e automações
-- =========================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- updated_at helper ----------
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------- Enums ----------
CREATE TYPE public.app_role AS ENUM ('cliente', 'profissional', 'admin');
CREATE TYPE public.account_status AS ENUM ('active', 'suspended', 'pending');
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.profile_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.availability_status AS ENUM ('available', 'busy', 'unavailable');
CREATE TYPE public.urgency_level AS ENUM ('hoje', 'esta-semana', 'data', 'sem-urgencia');
CREATE TYPE public.quote_status AS ENUM ('draft','open','receiving_proposals','professional_selected','in_progress','completed','cancelled','expired');
CREATE TYPE public.proposal_status AS ENUM ('sent','viewed','accepted','rejected','withdrawn');
CREATE TYPE public.review_status AS ENUM ('pending','approved','rejected','flagged');
CREATE TYPE public.price_type AS ENUM ('fixed','hourly','daily','per_visit','to_quote');
CREATE TYPE public.service_type AS ENUM ('residencial','empresarial','online');
CREATE TYPE public.notification_type AS ENUM ('info','proposal','review','system','moderation','opportunity');
CREATE TYPE public.report_status AS ENUM ('open','reviewing','resolved','dismissed');
CREATE TYPE public.subscription_status AS ENUM ('active','cancelled','expired','pending');

-- ---------- user_roles (base para permissões) ----------
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(_user_id, 'admin'::public.app_role); $$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- ---------- profiles ----------
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  city TEXT,
  state TEXT,
  account_status public.account_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE POLICY "read own or admin" ON public.profiles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "update own basic fields" ON public.profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin manage profiles" ON public.profiles FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Impede que o usuário mude account_status próprio (só admin)
CREATE OR REPLACE FUNCTION public.tg_protect_profile_admin_fields()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    NEW.account_status := OLD.account_status;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_profiles_protect BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_protect_profile_admin_fields();

-- ---------- client_profiles ----------
CREATE TABLE public.client_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  cpf TEXT,
  preferred_contact TEXT,
  notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_profiles TO authenticated;
GRANT ALL ON public.client_profiles TO service_role;
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_client_profiles_updated BEFORE UPDATE ON public.client_profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "client manage own" ON public.client_profiles FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- ---------- professional_profiles ----------
CREATE TABLE public.professional_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE,
  business_name TEXT,
  professional_name TEXT,
  description TEXT,
  years_experience INT,
  whatsapp TEXT,
  city TEXT,
  state TEXT,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  reviews_count INT NOT NULL DEFAULT 0,
  response_time TEXT,
  starting_price NUMERIC(12,2),
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  profile_status public.profile_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  availability_status public.availability_status NOT NULL DEFAULT 'available',
  emergency BOOLEAN NOT NULL DEFAULT false,
  service_types public.service_type[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.professional_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.professional_profiles TO authenticated;
GRANT ALL ON public.professional_profiles TO service_role;
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_professional_profiles_updated BEFORE UPDATE ON public.professional_profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_pro_city_state ON public.professional_profiles(city, state);
CREATE INDEX idx_pro_status ON public.professional_profiles(profile_status);

CREATE POLICY "public read published pros" ON public.professional_profiles FOR SELECT TO anon, authenticated
USING (profile_status = 'published' OR user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "pro insert own" ON public.professional_profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "pro update own" ON public.professional_profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Protege campos administrativos
CREATE OR REPLACE FUNCTION public.tg_protect_pro_admin_fields()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    NEW.verification_status := OLD.verification_status;
    NEW.is_featured := OLD.is_featured;
    NEW.average_rating := OLD.average_rating;
    NEW.reviews_count := OLD.reviews_count;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_pro_protect BEFORE UPDATE ON public.professional_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_protect_pro_admin_fields();

-- ---------- categories ----------
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "public read active categories" ON public.categories FOR SELECT TO anon, authenticated USING (active OR public.is_admin(auth.uid()));
CREATE POLICY "admin manage categories" ON public.categories FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ---------- services ----------
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_id, slug)
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "public read active services" ON public.services FOR SELECT TO anon, authenticated USING (active OR public.is_admin(auth.uid()));
CREATE POLICY "admin manage services" ON public.services FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ---------- professional_services ----------
CREATE TABLE public.professional_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  description TEXT,
  starting_price NUMERIC(12,2),
  price_type public.price_type NOT NULL DEFAULT 'to_quote',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(professional_id, service_id)
);
GRANT SELECT ON public.professional_services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.professional_services TO authenticated;
GRANT ALL ON public.professional_services TO service_role;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_pro_services_pro ON public.professional_services(professional_id);
CREATE INDEX idx_pro_services_srv ON public.professional_services(service_id);
CREATE POLICY "public read pro services" ON public.professional_services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "pro manage own services" ON public.professional_services FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND (p.user_id = auth.uid() OR public.is_admin(auth.uid()))))
WITH CHECK (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND (p.user_id = auth.uid() OR public.is_admin(auth.uid()))));

-- ---------- service_areas ----------
CREATE TABLE public.service_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  neighborhood TEXT,
  postal_code TEXT,
  radius_km INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_areas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_areas TO authenticated;
GRANT ALL ON public.service_areas TO service_role;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_areas_pro ON public.service_areas(professional_id);
CREATE INDEX idx_areas_city ON public.service_areas(city, state);
CREATE POLICY "public read areas" ON public.service_areas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "pro manage own areas" ON public.service_areas FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND (p.user_id = auth.uid() OR public.is_admin(auth.uid()))))
WITH CHECK (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND (p.user_id = auth.uid() OR public.is_admin(auth.uid()))));

-- ---------- portfolio_items ----------
CREATE TABLE public.portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.portfolio_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;
GRANT ALL ON public.portfolio_items TO service_role;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_portfolio_pro ON public.portfolio_items(professional_id);
CREATE POLICY "public read portfolio" ON public.portfolio_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "pro manage own portfolio" ON public.portfolio_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND (p.user_id = auth.uid() OR public.is_admin(auth.uid()))))
WITH CHECK (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND (p.user_id = auth.uid() OR public.is_admin(auth.uid()))));

-- ---------- certifications ----------
CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  institution TEXT,
  issued_at DATE,
  document_url TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certifications TO authenticated;
GRANT ALL ON public.certifications TO service_role;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_certs_pro ON public.certifications(professional_id);
CREATE POLICY "read approved certs public + own + admin" ON public.certifications FOR SELECT TO authenticated
USING (verification_status = 'approved' OR EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND p.user_id = auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "read approved certs anon" ON public.certifications FOR SELECT TO anon USING (verification_status = 'approved');
CREATE POLICY "pro manage own certs" ON public.certifications FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND (p.user_id = auth.uid() OR public.is_admin(auth.uid()))))
WITH CHECK (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND (p.user_id = auth.uid() OR public.is_admin(auth.uid()))));

-- ---------- quote_requests ----------
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  service_id UUID REFERENCES public.services(id),
  title TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  neighborhood TEXT,
  postal_code TEXT,
  urgency public.urgency_level NOT NULL DEFAULT 'sem-urgencia',
  preferred_date DATE,
  service_type public.service_type NOT NULL DEFAULT 'residencial',
  status public.quote_status NOT NULL DEFAULT 'draft',
  selected_professional_id UUID REFERENCES public.professional_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_quotes_updated BEFORE UPDATE ON public.quote_requests FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_quotes_client ON public.quote_requests(client_id);
CREATE INDEX idx_quotes_status ON public.quote_requests(status);
CREATE INDEX idx_quotes_category ON public.quote_requests(category_id);
CREATE INDEX idx_quotes_city ON public.quote_requests(city, state);

CREATE POLICY "client rw own quotes" ON public.quote_requests FOR ALL TO authenticated
USING (client_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (client_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "pros read open quotes" ON public.quote_requests FOR SELECT TO authenticated
USING (status IN ('open','receiving_proposals') AND public.has_role(auth.uid(), 'profissional'));

-- ---------- quote_request_files ----------
CREATE TABLE public.quote_request_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_request_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.quote_request_files TO authenticated;
GRANT ALL ON public.quote_request_files TO service_role;
ALTER TABLE public.quote_request_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quote files visibility" ON public.quote_request_files FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.quote_requests q WHERE q.id = quote_request_id AND (q.client_id = auth.uid() OR q.status IN ('open','receiving_proposals') OR public.is_admin(auth.uid()))));
CREATE POLICY "client manage quote files" ON public.quote_request_files FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.quote_requests q WHERE q.id = quote_request_id AND (q.client_id = auth.uid() OR public.is_admin(auth.uid()))))
WITH CHECK (EXISTS (SELECT 1 FROM public.quote_requests q WHERE q.id = quote_request_id AND (q.client_id = auth.uid() OR public.is_admin(auth.uid()))));

-- ---------- quote_proposals ----------
CREATE TABLE public.quote_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_request_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  estimated_price NUMERIC(12,2),
  price_type public.price_type NOT NULL DEFAULT 'to_quote',
  estimated_deadline TEXT,
  status public.proposal_status NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(quote_request_id, professional_id)
);
GRANT SELECT, INSERT, UPDATE ON public.quote_proposals TO authenticated;
GRANT ALL ON public.quote_proposals TO service_role;
ALTER TABLE public.quote_proposals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_proposals_updated BEFORE UPDATE ON public.quote_proposals FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_proposals_quote ON public.quote_proposals(quote_request_id);
CREATE INDEX idx_proposals_pro ON public.quote_proposals(professional_id);

CREATE POLICY "read proposals as client or pro or admin" ON public.quote_proposals FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.quote_requests q WHERE q.id = quote_request_id AND q.client_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND p.user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "pro insert own proposal" ON public.quote_proposals FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND p.user_id = auth.uid()));
CREATE POLICY "pro update own proposal" ON public.quote_proposals FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND p.user_id = auth.uid()) OR public.is_admin(auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND p.user_id = auth.uid()) OR public.is_admin(auth.uid()));

-- ---------- favorites ----------
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, professional_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client manage own favorites" ON public.favorites FOR ALL TO authenticated
USING (client_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (client_id = auth.uid());

-- ---------- reviews ----------
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_request_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  status public.review_status NOT NULL DEFAULT 'approved',
  professional_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(quote_request_id, client_id)
);
GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_reviews_pro ON public.reviews(professional_id);

CREATE POLICY "public read approved reviews" ON public.reviews FOR SELECT TO anon, authenticated
USING (status = 'approved' OR client_id = auth.uid() OR EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND p.user_id = auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "client insert review after completion" ON public.reviews FOR INSERT TO authenticated
WITH CHECK (
  client_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.quote_requests q WHERE q.id = quote_request_id AND q.client_id = auth.uid() AND q.status = 'completed' AND q.selected_professional_id = professional_id)
);
CREATE POLICY "client update own review" ON public.reviews FOR UPDATE TO authenticated
USING (client_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (client_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "pro reply to own review" ON public.reviews FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND p.user_id = auth.uid()));

-- ---------- leads ----------
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  quote_request_id UUID REFERENCES public.quote_requests(id) ON DELETE SET NULL,
  source TEXT,
  action_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.leads TO anon, authenticated;
GRANT SELECT ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_leads_pro ON public.leads(professional_id);
CREATE POLICY "insert leads anyone" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "pro read own leads" ON public.leads FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND p.user_id = auth.uid()) OR public.is_admin(auth.uid()));

-- ---------- notifications ----------
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type public.notification_type NOT NULL DEFAULT 'info',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notif_user ON public.notifications(user_id, read);
CREATE POLICY "user reads own notifications" ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "user marks own read" ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------- plans ----------
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  lead_limit INT,
  featured_profile BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "public read active plans" ON public.plans FOR SELECT TO anon, authenticated USING (active OR public.is_admin(auth.uid()));
CREATE POLICY "admin manage plans" ON public.plans FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ---------- subscriptions ----------
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status public.subscription_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  external_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "pro read own subs" ON public.subscriptions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND p.user_id = auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "admin manage subs" ON public.subscriptions FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ---------- reports ----------
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_id UUID REFERENCES public.reviews(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status public.report_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user create own report" ON public.reports FOR INSERT TO authenticated
WITH CHECK (reporter_user_id = auth.uid());
CREATE POLICY "reporter and admin read reports" ON public.reports FOR SELECT TO authenticated
USING (reporter_user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "admin manage reports" ON public.reports FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ---------- admin_logs ----------
CREATE TABLE public.admin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_logs TO authenticated;
GRANT ALL ON public.admin_logs TO service_role;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin only logs" ON public.admin_logs FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()) AND admin_user_id = auth.uid());

-- ---------- Trigger: cria profile automaticamente no signup ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (user_id) DO NOTHING;

  v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'cliente')::public.app_role;
  IF v_role = 'admin' THEN v_role := 'cliente'; END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role)
  ON CONFLICT DO NOTHING;

  IF v_role = 'cliente' THEN
    INSERT INTO public.client_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSIF v_role = 'profissional' THEN
    INSERT INTO public.professional_profiles (user_id, professional_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''))
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
