
-- Restrict system_settings public SELECT (was exposing integrations + email_templates)
DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;

CREATE POLICY "Admins can read system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Public branding view: only non-sensitive columns
CREATE OR REPLACE VIEW public.public_branding
WITH (security_invoker = false) AS
SELECT
  id, singleton, brand_name, tagline,
  logo_light_media_id, logo_dark_media_id, favicon_media_id,
  primary_color, accent_color,
  legal_name, address, support_email, support_phone, whatsapp,
  social_instagram, social_facebook, social_linkedin, social_youtube,
  default_locale, default_timezone, default_currency, date_format
FROM public.system_settings;

GRANT SELECT ON public.public_branding TO anon, authenticated;
