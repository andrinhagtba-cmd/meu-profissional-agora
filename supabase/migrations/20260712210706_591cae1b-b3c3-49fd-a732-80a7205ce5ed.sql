ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS search_tags text[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.professional_profiles.search_tags IS
  'Hashtags e palavras-chave para indexação e busca pública do profissional';