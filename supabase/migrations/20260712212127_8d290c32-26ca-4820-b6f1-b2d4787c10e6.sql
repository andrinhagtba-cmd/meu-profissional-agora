
-- ===== Presença digital + endereço + geolocalização em professional_profiles =====

-- 1) Enum de visibilidade do endereço público
DO $$ BEGIN
  CREATE TYPE public.address_visibility AS ENUM ('hidden','city_state','neighborhood_city_state','full_address');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Novas colunas
ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS instagram_username text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_complement text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS address_reference text,
  ADD COLUMN IF NOT EXISTS formatted_address text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS google_place_id text,
  ADD COLUMN IF NOT EXISTS service_radius_km numeric,
  ADD COLUMN IF NOT EXISTS serves_at_business_address boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS serves_at_customer_location boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS serves_remotely boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_address_visibility public.address_visibility NOT NULL DEFAULT 'city_state';

-- 3) Validações (constraints) — não bloqueiam registros antigos (permitem NULL)
ALTER TABLE public.professional_profiles
  DROP CONSTRAINT IF EXISTS professional_profiles_lat_range,
  DROP CONSTRAINT IF EXISTS professional_profiles_lng_range,
  DROP CONSTRAINT IF EXISTS professional_profiles_radius_positive;

ALTER TABLE public.professional_profiles
  ADD CONSTRAINT professional_profiles_lat_range
    CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90)),
  ADD CONSTRAINT professional_profiles_lng_range
    CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180)),
  ADD CONSTRAINT professional_profiles_radius_positive
    CHECK (service_radius_km IS NULL OR service_radius_km >= 0);

-- 4) Índices para busca por localização e place id
CREATE INDEX IF NOT EXISTS idx_pro_profiles_latlng
  ON public.professional_profiles (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_place_id
  ON public.professional_profiles (google_place_id);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_postal
  ON public.professional_profiles (postal_code);

-- 5) Manter public_branding/RLS existentes intactos — nenhuma política é substituída aqui.
