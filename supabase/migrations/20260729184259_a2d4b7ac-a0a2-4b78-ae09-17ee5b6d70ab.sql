CREATE TABLE public.professional_photo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_profile_id uuid NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  usage_type text NOT NULL,
  media_id uuid,
  previous_media_id uuid,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_photo_requests_status ON public.professional_photo_requests(status, created_at DESC);
CREATE INDEX idx_photo_requests_profile ON public.professional_photo_requests(professional_profile_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_photo_requests TO authenticated;
GRANT ALL ON public.professional_photo_requests TO service_role;

ALTER TABLE public.professional_photo_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own photo requests"
ON public.professional_photo_requests FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage photo requests"
ON public.professional_photo_requests FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_photo_requests_updated_at
BEFORE UPDATE ON public.professional_photo_requests
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.notify_admins_photo_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage text;
  v_media uuid;
  v_prev uuid;
  v_name text;
  v_label text;
  v_admin uuid;
BEGIN
  IF NEW.avatar_media_id IS DISTINCT FROM OLD.avatar_media_id AND NEW.avatar_media_id IS NOT NULL THEN
    v_usage := 'avatar'; v_media := NEW.avatar_media_id; v_prev := OLD.avatar_media_id; v_label := 'foto de perfil';
  ELSIF NEW.cover_media_id IS DISTINCT FROM OLD.cover_media_id AND NEW.cover_media_id IS NOT NULL THEN
    v_usage := 'cover'; v_media := NEW.cover_media_id; v_prev := OLD.cover_media_id; v_label := 'foto de capa';
  ELSE
    RETURN NEW;
  END IF;

  -- alterações feitas por administradores já são curadas
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  v_name := COALESCE(NEW.business_name, NEW.professional_name, 'Profissional');

  INSERT INTO public.professional_photo_requests
    (professional_profile_id, user_id, usage_type, media_id, previous_media_id)
  VALUES (NEW.id, NEW.user_id, v_usage, v_media, v_prev);

  FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_admin,
      'Nova imagem para aprovação',
      v_name || ' quer adicionar uma nova ' || v_label || '.',
      'moderation',
      '/admin/profissionais/' || NEW.id::text
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admins_photo_change
AFTER UPDATE OF avatar_media_id, cover_media_id ON public.professional_profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_photo_change();