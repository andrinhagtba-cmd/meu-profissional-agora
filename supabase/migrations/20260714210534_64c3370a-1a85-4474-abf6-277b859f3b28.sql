-- Default footer content matching the current hardcoded footer
DO $$
DECLARE
  default_footer jsonb := jsonb_build_object(
    'description', 'O jeito mais simples de encontrar profissionais de confiança perto de você. Compare, contrate e avalie sem complicação.',
    'copyright', 'plataforma. Todos os direitos reservados.',
    'cnpj_note', 'CNPJ 00.000.000/0001-00 (demonstração)',
    'contact_email', 'contato@proconecta.com.br',
    'columns', jsonb_build_array(
      jsonb_build_object('title','Plataforma','links', jsonb_build_array(
        jsonb_build_object('label','Como funciona','href','/sobre'),
        jsonb_build_object('label','Categorias','href','/categorias'),
        jsonb_build_object('label','Profissionais','href','/profissionais'),
        jsonb_build_object('label','Pedir orçamento','href','/pedir-orcamento'),
        jsonb_build_object('label','Blog','href','/blog')
      )),
      jsonb_build_object('title','Profissionais','links', jsonb_build_array(
        jsonb_build_object('label','Criar perfil','href','/cadastro/profissional'),
        jsonb_build_object('label','Entrar','href','/entrar'),
        jsonb_build_object('label','Planos','href','/planos'),
        jsonb_build_object('label','Central de ajuda','href','/contato')
      )),
      jsonb_build_object('title','Empresa','links', jsonb_build_array(
        jsonb_build_object('label','Sobre','href','/sobre'),
        jsonb_build_object('label','Contato','href','/contato'),
        jsonb_build_object('label','Trabalhe conosco','href','/contato'),
        jsonb_build_object('label','Imprensa','href','/contato')
      )),
      jsonb_build_object('title','Legal','links', jsonb_build_array(
        jsonb_build_object('label','Termos de uso','href','/sobre'),
        jsonb_build_object('label','Privacidade','href','/sobre'),
        jsonb_build_object('label','Cookies','href','/sobre'),
        jsonb_build_object('label','Diretrizes de avaliação','href','/sobre')
      ))
    )
  );
BEGIN
  ALTER TABLE public.system_settings
    ADD COLUMN IF NOT EXISTS footer_config jsonb NOT NULL DEFAULT '{}'::jsonb;

  ALTER TABLE public.public_branding
    ADD COLUMN IF NOT EXISTS footer_config jsonb NOT NULL DEFAULT '{}'::jsonb;

  -- Seed defaults where footer_config is empty
  UPDATE public.system_settings
     SET footer_config = default_footer
   WHERE singleton = true AND (footer_config IS NULL OR footer_config = '{}'::jsonb);

  UPDATE public.public_branding
     SET footer_config = default_footer
   WHERE singleton = true AND (footer_config IS NULL OR footer_config = '{}'::jsonb);
END $$;

-- Update sync trigger to include footer_config
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
    updated_at
  ) VALUES (
    NEW.id, NEW.singleton, COALESCE(NEW.brand_name, ''), NEW.tagline,
    NEW.logo_light_media_id, NEW.logo_dark_media_id, NEW.favicon_media_id,
    NEW.primary_color, NEW.accent_color,
    NEW.legal_name, NEW.address, NEW.support_email, NEW.support_phone, NEW.whatsapp,
    NEW.social_instagram, NEW.social_facebook, NEW.social_linkedin, NEW.social_youtube,
    NEW.default_locale, NEW.default_timezone, NEW.default_currency, NEW.date_format,
    COALESCE(NEW.footer_config, '{}'::jsonb),
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
    updated_at = now();
  RETURN NEW;
END;
$$;