
-- System-wide settings (singleton)
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  -- Brand
  brand_name text NOT NULL DEFAULT 'ProConecta',
  tagline text,
  logo_light_media_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  logo_dark_media_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  favicon_media_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  primary_color text DEFAULT '#0759F8',
  accent_color text DEFAULT '#FF642E',
  -- Company
  legal_name text,
  cnpj text,
  address text,
  support_email text,
  support_phone text,
  whatsapp text,
  social_instagram text,
  social_facebook text,
  social_linkedin text,
  social_youtube text,
  -- Preferences
  default_locale text DEFAULT 'pt-BR',
  default_timezone text DEFAULT 'America/Sao_Paulo',
  default_currency text DEFAULT 'BRL',
  date_format text DEFAULT 'dd/MM/yyyy',
  -- Integrations (JSON blobs)
  integrations jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Email templates (JSON map: key -> {subject, body_html, enabled})
  email_templates jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.system_settings TO anon, authenticated;
GRANT UPDATE, INSERT ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system settings"
  ON public.system_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert system settings"
  ON public.system_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update system settings"
  ON public.system_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_system_settings_updated
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed singleton row
INSERT INTO public.system_settings (singleton) VALUES (true)
ON CONFLICT (singleton) DO NOTHING;
