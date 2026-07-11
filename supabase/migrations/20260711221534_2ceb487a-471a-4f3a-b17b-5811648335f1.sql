CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role;
  v_name text;
  v_phone text;
  v_city text;
  v_state text;
BEGIN
  v_name  := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_city  := NEW.raw_user_meta_data->>'city';
  v_state := NEW.raw_user_meta_data->>'state';

  INSERT INTO public.profiles (user_id, full_name, email, phone, city, state)
  VALUES (NEW.id, v_name, NEW.email, v_phone, v_city, v_state)
  ON CONFLICT (user_id) DO NOTHING;

  v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'cliente')::public.app_role;
  IF v_role = 'admin' THEN v_role := 'cliente'; END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role)
  ON CONFLICT DO NOTHING;

  IF v_role = 'cliente' THEN
    INSERT INTO public.client_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSIF v_role = 'profissional' THEN
    INSERT INTO public.professional_profiles (user_id, professional_name, whatsapp, city, state)
    VALUES (NEW.id, v_name, v_phone, v_city, v_state)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;