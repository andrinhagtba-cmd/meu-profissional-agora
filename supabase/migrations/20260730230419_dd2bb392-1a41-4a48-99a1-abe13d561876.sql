CREATE POLICY "admins read all notifications" ON public.notifications FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admins delete notifications" ON public.notifications FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.admin_broadcast_notification(
  _audience text,
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
  IF _title IS NULL OR length(trim(_title)) = 0 THEN RAISE EXCEPTION 'Título obrigatório'; END IF;
  IF _audience NOT IN ('all','clientes','profissionais','admins') THEN RAISE EXCEPTION 'Audiência inválida'; END IF;

  WITH targets AS (
    SELECT p.user_id FROM public.profiles p WHERE _audience = 'all'
    UNION
    SELECT ur.user_id FROM public.user_roles ur
     WHERE _audience <> 'all'
       AND ur.role = (CASE _audience
             WHEN 'clientes' THEN 'cliente'
             WHEN 'profissionais' THEN 'profissional'
             ELSE 'admin' END)::public.app_role
  ), ins AS (
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT t.user_id, _title, COALESCE(_message,''), COALESCE(NULLIF(_type,''),'system')::public.notification_type, NULLIF(_link,'')
      FROM targets t
     WHERE t.user_id IS NOT NULL
    RETURNING 1
  )
  SELECT COUNT(*)::int INTO n FROM ins;

  RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.admin_broadcast_notification(text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_broadcast_notification(text,text,text,text,text) TO authenticated;