CREATE OR REPLACE FUNCTION public.admin_set_initial_view_count(p_professional_id uuid, p_value integer, p_reason text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_old integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Não autorizado'; END IF;
  IF p_value < 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;

  SELECT initial_view_count INTO v_old FROM public.professional_profiles WHERE id = p_professional_id;
  IF v_old IS NULL THEN RAISE EXCEPTION 'Perfil não encontrado'; END IF;

  UPDATE public.professional_profiles SET initial_view_count = p_value WHERE id = p_professional_id;

  INSERT INTO public.admin_logs (admin_user_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'update_initial_view_count', 'professional_profile', p_professional_id,
          jsonb_build_object('old', v_old, 'new', p_value, 'reason', p_reason));

  RETURN p_value;
END;
$function$;