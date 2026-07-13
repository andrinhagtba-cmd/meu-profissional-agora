
-- 1) Colunas no perfil profissional
ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS initial_view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS real_view_count bigint NOT NULL DEFAULT 0;

ALTER TABLE public.professional_profiles
  DROP CONSTRAINT IF EXISTS professional_profiles_initial_view_count_check,
  DROP CONSTRAINT IF EXISTS professional_profiles_real_view_count_check;

ALTER TABLE public.professional_profiles
  ADD CONSTRAINT professional_profiles_initial_view_count_check CHECK (initial_view_count >= 0),
  ADD CONSTRAINT professional_profiles_real_view_count_check CHECK (real_view_count >= 0);

-- 2) Tabela de eventos de visita
CREATE TABLE IF NOT EXISTS public.professional_profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  visitor_user_id uuid NULL,
  anonymous_visitor_id text NULL,
  session_id text NULL,
  source text NULL,
  referrer text NULL,
  user_agent_category text NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  view_day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ppv_visitor_present CHECK (visitor_user_id IS NOT NULL OR anonymous_visitor_id IS NOT NULL)
);

GRANT SELECT, INSERT ON public.professional_profile_views TO authenticated;
GRANT ALL ON public.professional_profile_views TO service_role;

CREATE INDEX IF NOT EXISTS ppv_pro_viewed_idx ON public.professional_profile_views (professional_id, viewed_at DESC);

-- Deduplicação por 24h: unique parciais por dia
CREATE UNIQUE INDEX IF NOT EXISTS ppv_dedup_user_day
  ON public.professional_profile_views (professional_id, visitor_user_id, view_day)
  WHERE visitor_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ppv_dedup_anon_day
  ON public.professional_profile_views (professional_id, anonymous_visitor_id, view_day)
  WHERE anonymous_visitor_id IS NOT NULL AND visitor_user_id IS NULL;

ALTER TABLE public.professional_profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all views" ON public.professional_profile_views;
CREATE POLICY "Admins can read all views" ON public.professional_profile_views
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Pro can read own profile views" ON public.professional_profile_views;
CREATE POLICY "Pro can read own profile views" ON public.professional_profile_views
  FOR SELECT TO authenticated
  USING (professional_id IN (SELECT id FROM public.professional_profiles WHERE user_id = auth.uid()));

-- Sem INSERT policy: só a RPC SECURITY DEFINER escreve.

-- 3) Reforça proteção do contador real e inicial no trigger existente
CREATE OR REPLACE FUNCTION public.tg_protect_pro_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    NEW.verification_status := OLD.verification_status;
    NEW.is_featured := OLD.is_featured;
    NEW.average_rating := OLD.average_rating;
    NEW.reviews_count := OLD.reviews_count;
    NEW.initial_view_count := OLD.initial_view_count;
  END IF;
  -- real_view_count nunca pode ser alterado por UPDATE direto (só pela RPC via bypass)
  NEW.real_view_count := OLD.real_view_count;
  RETURN NEW;
END;
$function$;

-- 4) Função segura para registrar visita
CREATE OR REPLACE FUNCTION public.register_professional_profile_view(
  p_slug text,
  p_anonymous_visitor_id text DEFAULT NULL,
  p_source text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_ua_category text DEFAULT NULL,
  p_session_id text DEFAULT NULL
)
RETURNS TABLE(public_total bigint, real_count bigint, initial_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pro_id uuid;
  v_owner uuid;
  v_status text;
  v_initial integer;
  v_real bigint;
  v_uid uuid := auth.uid();
  v_counted boolean := false;
BEGIN
  SELECT id, user_id, profile_status::text, initial_view_count, real_view_count
    INTO v_pro_id, v_owner, v_status, v_initial, v_real
    FROM public.professional_profiles
   WHERE slug = p_slug;

  IF v_pro_id IS NULL OR v_status <> 'published' THEN
    RETURN QUERY SELECT COALESCE(v_initial,0)::bigint + COALESCE(v_real,0),
                        COALESCE(v_real,0),
                        COALESCE(v_initial,0);
    RETURN;
  END IF;

  -- Não conta se o próprio dono está logado
  IF v_uid IS NOT NULL AND v_uid = v_owner THEN
    RETURN QUERY SELECT v_initial::bigint + v_real, v_real, v_initial;
    RETURN;
  END IF;

  -- Não conta se for admin autenticado (prévia)
  IF v_uid IS NOT NULL AND public.is_admin(v_uid) THEN
    RETURN QUERY SELECT v_initial::bigint + v_real, v_real, v_initial;
    RETURN;
  END IF;

  -- Sanitização: limita tamanhos
  p_source := left(COALESCE(p_source, 'web'), 40);
  p_referrer := left(p_referrer, 300);
  p_ua_category := left(p_ua_category, 40);
  p_anonymous_visitor_id := left(p_anonymous_visitor_id, 80);
  p_session_id := left(p_session_id, 80);

  -- Requer algum identificador de visitante
  IF v_uid IS NULL AND (p_anonymous_visitor_id IS NULL OR length(p_anonymous_visitor_id) < 8) THEN
    RETURN QUERY SELECT v_initial::bigint + v_real, v_real, v_initial;
    RETURN;
  END IF;

  BEGIN
    INSERT INTO public.professional_profile_views
      (professional_id, visitor_user_id, anonymous_visitor_id, session_id, source, referrer, user_agent_category)
    VALUES
      (v_pro_id, v_uid, CASE WHEN v_uid IS NULL THEN p_anonymous_visitor_id ELSE NULL END,
       p_session_id, p_source, p_referrer, p_ua_category);
    v_counted := true;
  EXCEPTION WHEN unique_violation THEN
    v_counted := false;
  END;

  IF v_counted THEN
    -- Incremento atômico bypassando o trigger de proteção
    UPDATE public.professional_profiles
       SET real_view_count = real_view_count + 1
     WHERE id = v_pro_id;
    v_real := v_real + 1;
  END IF;

  RETURN QUERY SELECT v_initial::bigint + v_real, v_real, v_initial;
END;
$$;

-- A UPDATE acima é bloqueada pelo trigger tg_protect_pro_admin_fields (real_view_count := OLD).
-- Solução: rodar com SESSION LOCAL role service_role NÃO é possível aqui; então marcamos a função
-- para permitir o incremento via variável de sessão detectada no trigger.
-- Refactor: usar uma sinalização por session GUC.

CREATE OR REPLACE FUNCTION public.tg_protect_pro_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_allow_view_bump text;
BEGIN
  BEGIN
    v_allow_view_bump := current_setting('app.allow_view_bump', true);
  EXCEPTION WHEN OTHERS THEN
    v_allow_view_bump := NULL;
  END;

  IF NOT public.is_admin(auth.uid()) THEN
    NEW.verification_status := OLD.verification_status;
    NEW.is_featured := OLD.is_featured;
    NEW.average_rating := OLD.average_rating;
    NEW.reviews_count := OLD.reviews_count;
    NEW.initial_view_count := OLD.initial_view_count;
  END IF;

  IF v_allow_view_bump IS DISTINCT FROM 'on' THEN
    NEW.real_view_count := OLD.real_view_count;
  END IF;

  RETURN NEW;
END;
$function$;

-- Refaz a RPC setando o GUC
CREATE OR REPLACE FUNCTION public.register_professional_profile_view(
  p_slug text,
  p_anonymous_visitor_id text DEFAULT NULL,
  p_source text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_ua_category text DEFAULT NULL,
  p_session_id text DEFAULT NULL
)
RETURNS TABLE(public_total bigint, real_count bigint, initial_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pro_id uuid;
  v_owner uuid;
  v_status text;
  v_initial integer;
  v_real bigint;
  v_uid uuid := auth.uid();
  v_counted boolean := false;
BEGIN
  SELECT id, user_id, profile_status::text, initial_view_count, real_view_count
    INTO v_pro_id, v_owner, v_status, v_initial, v_real
    FROM public.professional_profiles
   WHERE slug = p_slug;

  IF v_pro_id IS NULL OR v_status <> 'published' THEN
    RETURN QUERY SELECT COALESCE(v_initial,0)::bigint + COALESCE(v_real,0),
                        COALESCE(v_real,0),
                        COALESCE(v_initial,0);
    RETURN;
  END IF;

  IF v_uid IS NOT NULL AND (v_uid = v_owner OR public.is_admin(v_uid)) THEN
    RETURN QUERY SELECT v_initial::bigint + v_real, v_real, v_initial;
    RETURN;
  END IF;

  p_source := left(COALESCE(p_source, 'web'), 40);
  p_referrer := left(p_referrer, 300);
  p_ua_category := left(p_ua_category, 40);
  p_anonymous_visitor_id := left(p_anonymous_visitor_id, 80);
  p_session_id := left(p_session_id, 80);

  IF v_uid IS NULL AND (p_anonymous_visitor_id IS NULL OR length(p_anonymous_visitor_id) < 8) THEN
    RETURN QUERY SELECT v_initial::bigint + v_real, v_real, v_initial;
    RETURN;
  END IF;

  BEGIN
    INSERT INTO public.professional_profile_views
      (professional_id, visitor_user_id, anonymous_visitor_id, session_id, source, referrer, user_agent_category)
    VALUES
      (v_pro_id, v_uid, CASE WHEN v_uid IS NULL THEN p_anonymous_visitor_id ELSE NULL END,
       p_session_id, p_source, p_referrer, p_ua_category);
    v_counted := true;
  EXCEPTION WHEN unique_violation THEN
    v_counted := false;
  END;

  IF v_counted THEN
    PERFORM set_config('app.allow_view_bump', 'on', true);
    UPDATE public.professional_profiles
       SET real_view_count = real_view_count + 1
     WHERE id = v_pro_id;
    PERFORM set_config('app.allow_view_bump', 'off', true);
    v_real := v_real + 1;
  END IF;

  RETURN QUERY SELECT v_initial::bigint + v_real, v_real, v_initial;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_professional_profile_view(text, text, text, text, text, text) TO anon, authenticated;

-- 5) Estatísticas para painel do profissional (7d/30d) — próprio ou admin
CREATE OR REPLACE FUNCTION public.get_professional_view_stats(p_professional_id uuid)
RETURNS TABLE(initial_count integer, real_count bigint, public_total bigint, views_7d bigint, views_30d bigint, views_today bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner uuid;
  v_initial integer;
  v_real bigint;
BEGIN
  SELECT user_id, initial_view_count, real_view_count
    INTO v_owner, v_initial, v_real
    FROM public.professional_profiles WHERE id = p_professional_id;

  IF v_owner IS NULL THEN RAISE EXCEPTION 'Perfil não encontrado'; END IF;
  IF auth.uid() IS NULL OR (auth.uid() <> v_owner AND NOT public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  RETURN QUERY
  SELECT v_initial,
         v_real,
         v_initial::bigint + v_real,
         (SELECT COUNT(*) FROM public.professional_profile_views WHERE professional_id = p_professional_id AND viewed_at >= now() - interval '7 days')::bigint,
         (SELECT COUNT(*) FROM public.professional_profile_views WHERE professional_id = p_professional_id AND viewed_at >= now() - interval '30 days')::bigint,
         (SELECT COUNT(*) FROM public.professional_profile_views WHERE professional_id = p_professional_id AND viewed_at >= (now() AT TIME ZONE 'UTC')::date)::bigint;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_professional_view_stats(uuid) TO authenticated;

-- 6) Admin ajusta initial_view_count com log
CREATE OR REPLACE FUNCTION public.admin_set_initial_view_count(p_professional_id uuid, p_value integer, p_reason text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_old integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Não autorizado'; END IF;
  IF p_value < 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;

  SELECT initial_view_count INTO v_old FROM public.professional_profiles WHERE id = p_professional_id;
  IF v_old IS NULL THEN RAISE EXCEPTION 'Perfil não encontrado'; END IF;

  UPDATE public.professional_profiles SET initial_view_count = p_value WHERE id = p_professional_id;

  INSERT INTO public.admin_logs (actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'update_initial_view_count', 'professional_profile', p_professional_id,
          jsonb_build_object('old', v_old, 'new', p_value, 'reason', p_reason));

  RETURN p_value;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_initial_view_count(uuid, integer, text) TO authenticated;
