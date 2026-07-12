
-- 1. Track when the professional first viewed a direct quote
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS pro_viewed_at timestamptz;

-- 2. Update notification trigger to link to the professional's area
CREATE OR REPLACE FUNCTION public.tg_notify_pro_on_direct_quote()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pro_user uuid;
BEGIN
  IF NEW.selected_professional_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_pro_user
    FROM public.professional_profiles
   WHERE id = NEW.selected_professional_id;

  IF v_pro_user IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    v_pro_user,
    'Novo pedido de orçamento',
    'Você recebeu uma nova solicitação de orçamento pelo seu perfil público: "' || NEW.title || '"',
    'opportunity'::notification_type,
    '/painel/orcamentos/' || NEW.id::text
  );

  RETURN NEW;
END;
$function$;

-- 3. Backfill existing notifications to point at the new area
UPDATE public.notifications
   SET link = replace(link, '/painel/pedidos/', '/painel/orcamentos/')
 WHERE type = 'opportunity'
   AND link LIKE '/painel/pedidos/%';

-- 4. RPC: list direct quotes for the authenticated professional
CREATE OR REPLACE FUNCTION public.list_pro_direct_quotes()
 RETURNS TABLE(
   id uuid, title text, description text, city text, state text,
   neighborhood text, urgency text, service_type text, status text,
   created_at timestamptz, pro_viewed_at timestamptz,
   category_name text, category_slug text,
   service_name text,
   client_name text
 )
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT q.id, q.title, q.description, q.city, q.state, q.neighborhood,
         q.urgency::text, q.service_type::text, q.status::text,
         q.created_at, q.pro_viewed_at,
         c.name, c.slug,
         s.name,
         COALESCE(p.full_name, p.email)
    FROM public.quote_requests q
    LEFT JOIN public.categories c ON c.id = q.category_id
    LEFT JOIN public.services s ON s.id = q.service_id
    LEFT JOIN public.profiles p ON p.user_id = q.client_id
   WHERE q.selected_professional_id IN (
     SELECT id FROM public.professional_profiles WHERE user_id = auth.uid()
   )
   ORDER BY q.created_at DESC;
$$;

-- 5. RPC: full detail (including client contact) for one direct quote
CREATE OR REPLACE FUNCTION public.get_pro_direct_quote(_id uuid)
 RETURNS TABLE(
   id uuid, title text, description text, city text, state text,
   neighborhood text, urgency text, service_type text, status text,
   created_at timestamptz, pro_viewed_at timestamptz,
   preferred_date date,
   category_name text, category_slug text,
   service_name text, service_slug text,
   client_id uuid, client_name text, client_email text, client_phone text, client_city text
 )
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT q.id, q.title, q.description, q.city, q.state, q.neighborhood,
         q.urgency::text, q.service_type::text, q.status::text,
         q.created_at, q.pro_viewed_at, q.preferred_date,
         c.name, c.slug,
         s.name, s.slug,
         q.client_id, p.full_name, p.email, p.phone, p.city
    FROM public.quote_requests q
    LEFT JOIN public.categories c ON c.id = q.category_id
    LEFT JOIN public.services s ON s.id = q.service_id
    LEFT JOIN public.profiles p ON p.user_id = q.client_id
   WHERE q.id = _id
     AND q.selected_professional_id IN (
       SELECT id FROM public.professional_profiles WHERE user_id = auth.uid()
     );
$$;

-- 6. RPC: mark quote as viewed by the pro (sets pro_viewed_at once)
CREATE OR REPLACE FUNCTION public.mark_pro_quote_viewed(_id uuid)
 RETURNS void
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.quote_requests
     SET pro_viewed_at = COALESCE(pro_viewed_at, now())
   WHERE id = _id
     AND selected_professional_id IN (
       SELECT id FROM public.professional_profiles WHERE user_id = auth.uid()
     );
  -- also mark the related notifications as read
  UPDATE public.notifications
     SET read_at = COALESCE(read_at, now())
   WHERE user_id = auth.uid()
     AND type = 'opportunity'
     AND link = '/painel/orcamentos/' || _id::text;
END;
$$;

-- 7. RPC: count unread direct quotes for the auth pro
CREATE OR REPLACE FUNCTION public.count_pro_unread_direct_quotes()
 RETURNS integer
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::int
    FROM public.quote_requests q
   WHERE q.pro_viewed_at IS NULL
     AND q.selected_professional_id IN (
       SELECT id FROM public.professional_profiles WHERE user_id = auth.uid()
     );
$$;

GRANT EXECUTE ON FUNCTION public.list_pro_direct_quotes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pro_direct_quote(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_pro_quote_viewed(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_pro_unread_direct_quotes() TO authenticated;
