
-- Trigger to auto-create profile + role on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Protection triggers
DROP TRIGGER IF EXISTS tg_protect_profile_admin_fields ON public.profiles;
CREATE TRIGGER tg_protect_profile_admin_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_protect_profile_admin_fields();

DROP TRIGGER IF EXISTS tg_protect_pro_admin_fields ON public.professional_profiles;
CREATE TRIGGER tg_protect_pro_admin_fields
BEFORE UPDATE ON public.professional_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_protect_pro_admin_fields();

-- updated_at triggers on relevant tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema='public' AND column_name='updated_at'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS tg_set_updated_at ON public.%I;', t);
    EXECUTE format('CREATE TRIGGER tg_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();', t);
  END LOOP;
END$$;
