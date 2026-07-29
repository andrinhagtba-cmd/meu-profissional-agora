ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS service_regions text[] NOT NULL DEFAULT '{}'::text[];