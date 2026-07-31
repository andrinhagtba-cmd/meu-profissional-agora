CREATE OR REPLACE FUNCTION public.admin_notify_user(
  _user_id uuid,
  _title text,
  _message text,
  _link text DEFAULT NULL,
  _type text DEFAULT 'system'
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE n int := 0;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Não autorizado'; END IF;
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Destinatário obrigatório'; END IF;
  IF _title IS NULL OR length(trim(_title)) = 0 THEN RAISE EXCEPTION 'Título obrigatório'; END IF;

  WITH ins AS (
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (_user_id, _title, COALESCE(_message,''), COALESCE(NULLIF(_type,''),'system')::public.notification_type, NULLIF(_link,''))
    RETURNING 1
  )
  SELECT COUNT(*)::int INTO n FROM ins;

  RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.admin_notify_user(uuid,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_notify_user(uuid,text,text,text,text) TO authenticated;