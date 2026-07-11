ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_avatar_media_id ON public.profiles(avatar_media_id);

-- Reaplica permissões explícitas para a tabela já existente após a extensão do perfil.
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;