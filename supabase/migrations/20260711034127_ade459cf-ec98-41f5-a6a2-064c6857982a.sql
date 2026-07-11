
-- Etapa C: Growth modules (Coupons, Benefits, Highlights, B2B)

-- 1) COUPONS
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value numeric(10,2) NOT NULL CHECK (discount_value >= 0),
  min_amount numeric(10,2) DEFAULT 0,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  per_user_limit integer DEFAULT 1,
  applies_to text NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all','plans','categories','professionals')),
  target_ids uuid[] DEFAULT '{}',
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','expired','draft')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_admin_all" ON public.coupons FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER coupons_updated BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2) BENEFITS
CREATE TABLE public.benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text DEFAULT 'sparkles',
  category text DEFAULT 'geral',
  audience text NOT NULL DEFAULT 'both' CHECK (audience IN ('client','pro','both')),
  badge_color text DEFAULT 'primary',
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.benefits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.benefits TO authenticated;
GRANT ALL ON public.benefits TO service_role;
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "benefits_public_read" ON public.benefits FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_admin(auth.uid()));
CREATE POLICY "benefits_admin_write" ON public.benefits FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER benefits_updated BEFORE UPDATE ON public.benefits FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 3) HIGHLIGHTS (destaques)
CREATE TABLE public.highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  section text NOT NULL DEFAULT 'home' CHECK (section IN ('home','category','city','banner')),
  reference text,
  position integer NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.highlights TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.highlights TO authenticated;
GRANT ALL ON public.highlights TO service_role;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "highlights_public_read" ON public.highlights FOR SELECT TO anon, authenticated
  USING (is_active = true AND (ends_at IS NULL OR ends_at > now()) OR public.is_admin(auth.uid()));
CREATE POLICY "highlights_admin_write" ON public.highlights FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER highlights_updated BEFORE UPDATE ON public.highlights FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4) B2B COMPANIES
CREATE TABLE public.b2b_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  logo_url text,
  address text,
  city text,
  state text,
  segment text,
  employees_count integer,
  monthly_volume numeric(12,2),
  plan text,
  status text NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect','negotiating','active','paused','lost')),
  notes text,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.b2b_companies TO authenticated;
GRANT ALL ON public.b2b_companies TO service_role;
ALTER TABLE public.b2b_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "b2b_admin_all" ON public.b2b_companies FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER b2b_updated BEFORE UPDATE ON public.b2b_companies FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
