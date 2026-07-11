
-- ============ media_assets: tabela central de mídias ============
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_name TEXT NOT NULL,
  object_path TEXT NOT NULL,
  original_filename TEXT,
  entity_type TEXT,
  entity_id UUID,
  usage_type TEXT,
  alt_text TEXT,
  title TEXT,
  mime_type TEXT,
  file_size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  source_type TEXT,
  legacy_path TEXT,
  checksum TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT media_assets_bucket_path_uniq UNIQUE (bucket_name, object_path)
);

CREATE INDEX IF NOT EXISTS idx_media_assets_entity ON public.media_assets(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_checksum ON public.media_assets(checksum) WHERE checksum IS NOT NULL;

GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Público: apenas mídias ativas de escopos públicos
CREATE POLICY "public read active public media" ON public.media_assets
  FOR SELECT TO anon, authenticated
  USING (
    status = 'active'
    AND bucket_name IN ('public-media','professional-media')
  );

-- Profissional: gerenciar próprias mídias
CREATE POLICY "pro insert own media" ON public.media_assets
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "pro update own media" ON public.media_assets
  FOR UPDATE TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "pro delete own media" ON public.media_assets
  FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "admin manage media" ON public.media_assets
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ Extensões nas tabelas existentes ============
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS card_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cover_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS icon_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_alt TEXT,
  ADD COLUMN IF NOT EXISTS badge_text TEXT,
  ADD COLUMN IF NOT EXISTS badge_variant TEXT,
  ADD COLUMN IF NOT EXISTS badge_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS badge_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS badge_end_at TIMESTAMPTZ;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS card_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cover_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_alt TEXT,
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS avatar_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cover_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL;

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';

-- ============ Log de migração idempotente ============
CREATE TABLE IF NOT EXISTS public.media_migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_path TEXT NOT NULL UNIQUE,
  destination_path TEXT,
  media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  migrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media_migration_logs TO authenticated;
GRANT ALL ON public.media_migration_logs TO service_role;
ALTER TABLE public.media_migration_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read migration logs" ON public.media_migration_logs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
