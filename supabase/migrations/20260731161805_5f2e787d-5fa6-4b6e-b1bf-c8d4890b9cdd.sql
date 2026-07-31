DROP INDEX IF EXISTS public.ppv_dedup_user_day;
DROP INDEX IF EXISTS public.ppv_dedup_anon_day;
CREATE INDEX IF NOT EXISTS ppv_pro_user_day_idx ON public.professional_profile_views (professional_id, visitor_user_id, view_day);
CREATE INDEX IF NOT EXISTS ppv_pro_anon_day_idx ON public.professional_profile_views (professional_id, anonymous_visitor_id, view_day);

CREATE OR REPLACE FUNCTION public.register_professional_profile_view(p_slug text, p_anonymous_visitor_id text DEFAULT NULL::text, p_source text DEFAULT NULL::text, p_referrer text DEFAULT NULL::text, p_ua_category text DEFAULT NULL::text, p_session_id text DEFAULT NULL::text)
 RETURNS TABLE(public_total bigint, real_count bigint, initial_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pro_id uuid;
  v_owner uuid;
  v_status text;
  v_initial integer;
  v_real bigint;
  v_uid uuid := auth.uid();
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

  INSERT INTO public.professional_profile_views
    (professional_id, visitor_user_id, anonymous_visitor_id, session_id, source, referrer, user_agent_category)
  VALUES
    (v_pro_id, v_uid, CASE WHEN v_uid IS NULL THEN p_anonymous_visitor_id ELSE NULL END,
     p_session_id, p_source, p_referrer, p_ua_category);

  PERFORM set_config('app.allow_view_bump', 'on', true);
  UPDATE public.professional_profiles
     SET real_view_count = real_view_count + 1
   WHERE id = v_pro_id;
  PERFORM set_config('app.allow_view_bump', 'off', true);
  v_real := v_real + 1;

  RETURN QUERY SELECT v_initial::bigint + v_real, v_real, v_initial;
END;
$function$;