DROP VIEW IF EXISTS public.public_branding;

CREATE TABLE IF NOT EXISTS public.public_branding (
  id uuid PRIMARY KEY,
  singleton boolean NOT NULL DEFAULT true,
  brand_name text NOT NULL DEFAULT '',
  tagline text,
  logo_light_media_id uuid,
  logo_dark_media_id uuid,
  favicon_media_id uuid,
  primary_color text,
  accent_color text,
  legal_name text,
  address text,
  support_email text,
  support_phone text,
  whatsapp text,
  social_instagram text,
  social_facebook text,
  social_linkedin text,
  social_youtube text,
  default_locale text,
  default_timezone text,
  default_currency text,
  date_format text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.public_branding TO anon, authenticated;
GRANT ALL ON public.public_branding TO service_role;

ALTER TABLE public.public_branding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read branding" ON public.public_branding;
CREATE POLICY "Public can read branding"
ON public.public_branding
FOR SELECT
TO anon, authenticated
USING (true);

REVOKE ALL ON public.system_settings FROM anon;
REVOKE ALL ON public.system_settings FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;

CREATE OR REPLACE FUNCTION public.sync_public_branding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.public_branding (
    id, singleton, brand_name, tagline,
    logo_light_media_id, logo_dark_media_id, favicon_media_id,
    primary_color, accent_color,
    legal_name, address, support_email, support_phone, whatsapp,
    social_instagram, social_facebook, social_linkedin, social_youtube,
    default_locale, default_timezone, default_currency, date_format,
    updated_at
  ) VALUES (
    NEW.id, NEW.singleton, COALESCE(NEW.brand_name, ''), NEW.tagline,
    NEW.logo_light_media_id, NEW.logo_dark_media_id, NEW.favicon_media_id,
    NEW.primary_color, NEW.accent_color,
    NEW.legal_name, NEW.address, NEW.support_email, NEW.support_phone, NEW.whatsapp,
    NEW.social_instagram, NEW.social_facebook, NEW.social_linkedin, NEW.social_youtube,
    NEW.default_locale, NEW.default_timezone, NEW.default_currency, NEW.date_format,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    singleton = EXCLUDED.singleton,
    brand_name = EXCLUDED.brand_name,
    tagline = EXCLUDED.tagline,
    logo_light_media_id = EXCLUDED.logo_light_media_id,
    logo_dark_media_id = EXCLUDED.logo_dark_media_id,
    favicon_media_id = EXCLUDED.favicon_media_id,
    primary_color = EXCLUDED.primary_color,
    accent_color = EXCLUDED.accent_color,
    legal_name = EXCLUDED.legal_name,
    address = EXCLUDED.address,
    support_email = EXCLUDED.support_email,
    support_phone = EXCLUDED.support_phone,
    whatsapp = EXCLUDED.whatsapp,
    social_instagram = EXCLUDED.social_instagram,
    social_facebook = EXCLUDED.social_facebook,
    social_linkedin = EXCLUDED.social_linkedin,
    social_youtube = EXCLUDED.social_youtube,
    default_locale = EXCLUDED.default_locale,
    default_timezone = EXCLUDED.default_timezone,
    default_currency = EXCLUDED.default_currency,
    date_format = EXCLUDED.date_format,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_public_branding_on_settings ON public.system_settings;
CREATE TRIGGER sync_public_branding_on_settings
AFTER INSERT OR UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.sync_public_branding();

INSERT INTO public.public_branding (
  id, singleton, brand_name, tagline,
  logo_light_media_id, logo_dark_media_id, favicon_media_id,
  primary_color, accent_color,
  legal_name, address, support_email, support_phone, whatsapp,
  social_instagram, social_facebook, social_linkedin, social_youtube,
  default_locale, default_timezone, default_currency, date_format,
  updated_at
)
SELECT
  id, singleton, COALESCE(brand_name, ''), tagline,
  logo_light_media_id, logo_dark_media_id, favicon_media_id,
  primary_color, accent_color,
  legal_name, address, support_email, support_phone, whatsapp,
  social_instagram, social_facebook, social_linkedin, social_youtube,
  default_locale, default_timezone, default_currency, date_format,
  now()
FROM public.system_settings
WHERE singleton = true
ON CONFLICT (id) DO UPDATE SET
  singleton = EXCLUDED.singleton,
  brand_name = EXCLUDED.brand_name,
  tagline = EXCLUDED.tagline,
  logo_light_media_id = EXCLUDED.logo_light_media_id,
  logo_dark_media_id = EXCLUDED.logo_dark_media_id,
  favicon_media_id = EXCLUDED.favicon_media_id,
  primary_color = EXCLUDED.primary_color,
  accent_color = EXCLUDED.accent_color,
  legal_name = EXCLUDED.legal_name,
  address = EXCLUDED.address,
  support_email = EXCLUDED.support_email,
  support_phone = EXCLUDED.support_phone,
  whatsapp = EXCLUDED.whatsapp,
  social_instagram = EXCLUDED.social_instagram,
  social_facebook = EXCLUDED.social_facebook,
  social_linkedin = EXCLUDED.social_linkedin,
  social_youtube = EXCLUDED.social_youtube,
  default_locale = EXCLUDED.default_locale,
  default_timezone = EXCLUDED.default_timezone,
  default_currency = EXCLUDED.default_currency,
  date_format = EXCLUDED.date_format,
  updated_at = now();