CREATE OR REPLACE FUNCTION public.tg_portfolio_items_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Aprovação automática: novos itens já entram publicados
    NEW.moderation_status := 'approved';
    NEW.moderated_by := auth.uid();
    NEW.moderated_at := now();
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT public.is_admin(auth.uid()) THEN
      NEW.moderation_status := OLD.moderation_status;
      NEW.moderation_notes := OLD.moderation_notes;
      NEW.moderated_by := OLD.moderated_by;
      NEW.moderated_at := OLD.moderated_at;
    ELSIF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
      NEW.moderated_by := auth.uid();
      NEW.moderated_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_admins_photo_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_usage text;
  v_media uuid;
  v_prev uuid;
BEGIN
  IF NEW.avatar_media_id IS DISTINCT FROM OLD.avatar_media_id AND NEW.avatar_media_id IS NOT NULL THEN
    v_usage := 'avatar'; v_media := NEW.avatar_media_id; v_prev := OLD.avatar_media_id;
  ELSIF NEW.cover_media_id IS DISTINCT FROM OLD.cover_media_id AND NEW.cover_media_id IS NOT NULL THEN
    v_usage := 'cover'; v_media := NEW.cover_media_id; v_prev := OLD.cover_media_id;
  ELSE
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Registro apenas para histórico: já aprovado automaticamente
  INSERT INTO public.professional_photo_requests
    (professional_profile_id, user_id, usage_type, media_id, previous_media_id, status, reviewed_at)
  VALUES (NEW.id, NEW.user_id, v_usage, v_media, v_prev, 'approved', now());

  RETURN NEW;
END;
$function$;

UPDATE public.portfolio_items SET moderation_status = 'approved', moderated_at = now()
WHERE moderation_status = 'pending';

UPDATE public.professional_photo_requests SET status = 'approved', reviewed_at = now()
WHERE status = 'pending';