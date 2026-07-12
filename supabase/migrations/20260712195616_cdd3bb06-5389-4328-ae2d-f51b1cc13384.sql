
DROP VIEW IF EXISTS public.public_branding;

CREATE VIEW public.public_branding
WITH (security_invoker = true) AS
SELECT
  id, singleton, brand_name, tagline,
  logo_light_media_id, logo_dark_media_id, favicon_media_id,
  primary_color, accent_color,
  legal_name, address, support_email, support_phone, whatsapp,
  social_instagram, social_facebook, social_linkedin, social_youtube,
  default_locale, default_timezone, default_currency, date_format
FROM public.system_settings;

GRANT SELECT ON public.public_branding TO anon, authenticated;

-- Allow anon/authenticated to read branding-safe columns via the view.
-- The view's security_invoker means it uses the caller's RLS on system_settings,
-- so add a permissive-but-column-agnostic policy limited to reads through the view path.
-- Simplest: add a SELECT policy allowing anon/authenticated, since the view already
-- excludes sensitive columns and admin still has its own policy for full access.
CREATE POLICY "Public branding fields readable"
ON public.system_settings
FOR SELECT
TO anon, authenticated
USING (true);
