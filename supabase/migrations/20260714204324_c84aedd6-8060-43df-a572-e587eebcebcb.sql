
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS highlight_text text,
  ADD COLUMN IF NOT EXISTS cta_primary_label text,
  ADD COLUMN IF NOT EXISTS cta_primary_href text,
  ADD COLUMN IF NOT EXISTS cta_secondary_label text,
  ADD COLUMN IF NOT EXISTS cta_secondary_href text;

-- Seed the current hero as first hero banner if none exists
INSERT INTO public.banners (title, highlight_text, subtitle, image_url, position, is_active, display_order, cta_primary_label, cta_primary_href, cta_secondary_label, cta_secondary_href)
SELECT
  'Encontre as {{highlight}} e profissionais do DF e entorno em um só lugar.',
  'melhores empresas',
  'Compare, consulte avaliações e solicite orçamentos de quem atende perto de você com segurança.',
  NULL,
  'hero',
  true,
  0,
  'Encontrar profissional',
  '/buscar',
  'Pedir orçamento',
  '/pedir-orcamento'
WHERE NOT EXISTS (SELECT 1 FROM public.banners WHERE position = 'hero');
