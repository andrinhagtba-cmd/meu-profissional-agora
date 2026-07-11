ALTER TABLE public.professional_profiles ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.professional_profiles ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'user';