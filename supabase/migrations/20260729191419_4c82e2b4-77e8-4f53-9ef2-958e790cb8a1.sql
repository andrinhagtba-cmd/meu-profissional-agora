-- fallback simples de remoção de acentos (sem depender da extensão unaccent)
CREATE OR REPLACE FUNCTION public.unaccent_fallback(_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT translate(
    COALESCE(_input, ''),
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
  );
$$;

CREATE OR REPLACE FUNCTION public.slugify_text(_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(
    left(
      trim(both '-' from
        regexp_replace(
          lower(public.unaccent_fallback(_input)),
          '[^a-z0-9]+', '-', 'g'
        )
      ), 60
    ), '');
$$;

CREATE OR REPLACE FUNCTION public.professional_slug_available(_slug text, _profile_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _slug IS NOT NULL
     AND _slug = public.slugify_text(_slug)
     AND length(_slug) >= 3
     AND NOT EXISTS (
       SELECT 1 FROM public.professional_profiles p
        WHERE p.slug = _slug
          AND (_profile_id IS NULL OR p.id <> _profile_id)
     );
$$;

CREATE OR REPLACE FUNCTION public.suggest_professional_slugs(_base text, _profile_id uuid DEFAULT NULL, _limit integer DEFAULT 5)
RETURNS TABLE(slug text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base text := public.slugify_text(_base);
  v_city text;
  v_candidate text;
  v_found integer := 0;
  i integer := 1;
BEGIN
  IF v_base IS NULL OR length(v_base) < 3 THEN
    RETURN;
  END IF;

  IF public.professional_slug_available(v_base, _profile_id) THEN
    slug := v_base; v_found := v_found + 1; RETURN NEXT;
  END IF;

  IF _profile_id IS NOT NULL THEN
    SELECT public.slugify_text(city) INTO v_city FROM public.professional_profiles WHERE id = _profile_id;
    IF v_city IS NOT NULL THEN
      v_candidate := left(v_base || '-' || v_city, 60);
      IF public.professional_slug_available(v_candidate, _profile_id) AND v_found < _limit THEN
        slug := v_candidate; v_found := v_found + 1; RETURN NEXT;
      END IF;
    END IF;
  END IF;

  WHILE v_found < _limit AND i <= 50 LOOP
    i := i + 1;
    v_candidate := left(v_base, 57) || '-' || i::text;
    IF public.professional_slug_available(v_candidate, _profile_id) THEN
      slug := v_candidate; v_found := v_found + 1; RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.slugify_text(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unaccent_fallback(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.professional_slug_available(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.suggest_professional_slugs(text, uuid, integer) TO authenticated;