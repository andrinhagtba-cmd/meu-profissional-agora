DROP VIEW IF EXISTS public.public_branding;

CREATE VIEW public.public_branding
WITH (security_invoker = false) AS
SELECT
  id,
  singleton,
  brand_name,
  tagline,
  logo_light_media_id,
  logo_dark_media_id,
  favicon_media_id,
  primary_color,
  accent_color,
  legal_name,
  address,
  support_email,
  support_phone,
  whatsapp,
  social_instagram,
  social_facebook,
  social_linkedin,
  social_youtube,
  default_locale,
  default_timezone,
  default_currency,
  date_format
FROM public.system_settings
WHERE singleton = true;

GRANT SELECT ON public.public_branding TO anon, authenticated;

DROP POLICY IF EXISTS "Public branding fields readable" ON public.system_settings;
DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'system_settings'
      AND policyname = 'Admins can read system settings'
  ) THEN
    CREATE POLICY "Admins can read system settings"
    ON public.system_settings
    FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;