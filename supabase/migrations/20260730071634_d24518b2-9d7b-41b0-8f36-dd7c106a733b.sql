ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS pwa_name text,
  ADD COLUMN IF NOT EXISTS pwa_short_name text,
  ADD COLUMN IF NOT EXISTS pwa_description text,
  ADD COLUMN IF NOT EXISTS pwa_icon_media_id uuid,
  ADD COLUMN IF NOT EXISTS pwa_theme_color text,
  ADD COLUMN IF NOT EXISTS pwa_background_color text;

ALTER TABLE public.public_branding
  ADD COLUMN IF NOT EXISTS pwa_name text,
  ADD COLUMN IF NOT EXISTS pwa_short_name text,
  ADD COLUMN IF NOT EXISTS pwa_description text,
  ADD COLUMN IF NOT EXISTS pwa_icon_media_id uuid,
  ADD COLUMN IF NOT EXISTS pwa_theme_color text,
  ADD COLUMN IF NOT EXISTS pwa_background_color text;

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
    footer_config,
    pwa_name, pwa_short_name, pwa_description, pwa_icon_media_id,
    pwa_theme_color, pwa_background_color,
    updated_at
  ) VALUES (
    NEW.id, NEW.singleton, COALESCE(NEW.brand_name, ''), NEW.tagline,
    NEW.logo_light_media_id, NEW.logo_dark_media_id, NEW.favicon_media_id,
    NEW.primary_color, NEW.accent_color,
    NEW.legal_name, NEW.address, NEW.support_email, NEW.support_phone, NEW.whatsapp,
    NEW.social_instagram, NEW.social_facebook, NEW.social_linkedin, NEW.social_youtube,
    NEW.default_locale, NEW.default_timezone, NEW.default_currency, NEW.date_format,
    COALESCE(NEW.footer_config, '{}'::jsonb),
    NEW.pwa_name, NEW.pwa_short_name, NEW.pwa_description, NEW.pwa_icon_media_id,
    NEW.pwa_theme_color, NEW.pwa_background_color,
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
    footer_config = EXCLUDED.footer_config,
    pwa_name = EXCLUDED.pwa_name,
    pwa_short_name = EXCLUDED.pwa_short_name,
    pwa_description = EXCLUDED.pwa_description,
    pwa_icon_media_id = EXCLUDED.pwa_icon_media_id,
    pwa_theme_color = EXCLUDED.pwa_theme_color,
    pwa_background_color = EXCLUDED.pwa_background_color,
    updated_at = now();
  RETURN NEW;
END;
$$;

UPDATE public.system_settings SET updated_at = now() WHERE singleton = true;