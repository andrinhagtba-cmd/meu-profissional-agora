
-- 1) Quiet hours + priority aware push gate
CREATE OR REPLACE FUNCTION public.notification_push_allowed(_user_id uuid, _type text, _priority text DEFAULT 'normal')
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  p public.notification_preferences%ROWTYPE;
  v_hour int;
  v_allowed boolean;
  v_quiet boolean := false;
BEGIN
  SELECT * INTO p FROM public.notification_preferences WHERE user_id = _user_id;
  IF p.user_id IS NULL THEN
    RETURN true;
  END IF;

  IF NOT p.push_enabled THEN RETURN false; END IF;

  v_allowed := CASE
    WHEN _type IN ('message','message_new') THEN p.push_messages
    WHEN _type IN ('opportunity','quote_status') THEN p.push_quotes
    WHEN _type IN ('proposal','proposal_accepted','proposal_rejected') THEN p.push_proposals
    WHEN _type IN ('review','review_new') THEN p.push_reviews
    WHEN _type = 'moderation' THEN p.push_moderation
    ELSE p.push_system
  END;
  IF NOT v_allowed THEN RETURN false; END IF;

  IF p.quiet_hours_start IS NOT NULL AND p.quiet_hours_end IS NOT NULL
     AND p.quiet_hours_start <> p.quiet_hours_end THEN
    v_hour := EXTRACT(HOUR FROM (now() AT TIME ZONE 'America/Sao_Paulo'))::int;
    IF p.quiet_hours_start < p.quiet_hours_end THEN
      v_quiet := v_hour >= p.quiet_hours_start AND v_hour < p.quiet_hours_end;
    ELSE
      v_quiet := v_hour >= p.quiet_hours_start OR v_hour < p.quiet_hours_end;
    END IF;
  END IF;

  IF v_quiet AND COALESCE(_priority, 'normal') <> 'high' THEN
    RETURN false;
  END IF;

  RETURN true;
END $function$;

-- dispatch trigger respects priority + records quiet-hour skips
CREATE OR REPLACE FUNCTION public.tg_notifications_dispatch_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_url text;
  v_secret text;
BEGIN
  IF NOT public.notification_push_allowed(NEW.user_id, NEW.type::text, NEW.priority) THEN
    UPDATE public.notifications SET push_status = 'skipped' WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  SELECT value INTO v_url FROM public.app_private_config WHERE key = 'push_function_url';
  SELECT value INTO v_secret FROM public.app_private_config WHERE key = 'push_hook_secret';
  IF v_url IS NULL OR v_secret IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM extensions.net_http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type','application/json','x-push-secret', v_secret),
    body := jsonb_build_object('notificationId', NEW.id),
    timeout_milliseconds := 8000
  );
  RETURN NEW;
END $function$;

-- 2) Deduplication of identical events per user
CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_dedupe_key_idx
  ON public.notifications (user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.tg_notifications_dedupe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.dedupe_key IS NULL THEN RETURN NEW; END IF;
  IF EXISTS (
    SELECT 1 FROM public.notifications
     WHERE user_id = NEW.user_id AND dedupe_key = NEW.dedupe_key
  ) THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS notifications_dedupe ON public.notifications;
CREATE TRIGGER notifications_dedupe
  BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.tg_notifications_dedupe();

-- 3) Portfolio moderation result -> professional
CREATE OR REPLACE FUNCTION public.tg_notify_pro_on_portfolio_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_user uuid;
BEGIN
  IF NEW.moderation_status IS NOT DISTINCT FROM OLD.moderation_status THEN RETURN NEW; END IF;
  IF NEW.moderation_status NOT IN ('approved','rejected') THEN RETURN NEW; END IF;

  SELECT user_id INTO v_user FROM public.professional_profiles WHERE id = NEW.professional_id;
  IF v_user IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, title, message, type, link, priority, entity_type, entity_id, dedupe_key)
  VALUES (
    v_user,
    CASE WHEN NEW.moderation_status = 'approved' THEN 'Item do portfólio aprovado' ELSE 'Item do portfólio recusado' END,
    CASE WHEN NEW.moderation_status = 'approved'
      THEN COALESCE(NULLIF(NEW.title,''), 'Seu item') || ' já está visível no seu perfil.'
      ELSE COALESCE(NULLIF(NEW.moderation_notes,''), 'O item não atende às diretrizes da plataforma.') END,
    'moderation', '/painel/portfolio', 'normal', 'portfolio_item', NEW.id,
    'portfolio:' || NEW.id::text || ':' || NEW.moderation_status
  );
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS portfolio_items_notify_moderation ON public.portfolio_items;
CREATE TRIGGER portfolio_items_notify_moderation
  AFTER UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_pro_on_portfolio_moderation();

-- 4) Photo request review result -> professional
CREATE OR REPLACE FUNCTION public.tg_notify_pro_on_photo_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_label text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('approved','rejected') THEN RETURN NEW; END IF;
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;

  v_label := CASE WHEN NEW.usage_type = 'cover' THEN 'foto de capa' ELSE 'foto de perfil' END;

  INSERT INTO public.notifications (user_id, title, message, type, link, priority, entity_type, entity_id, dedupe_key)
  VALUES (
    NEW.user_id,
    CASE WHEN NEW.status = 'approved' THEN 'Foto aprovada' ELSE 'Foto recusada' END,
    CASE WHEN NEW.status = 'approved'
      THEN 'Sua nova ' || v_label || ' foi aprovada e já está no ar.'
      ELSE 'Sua nova ' || v_label || ' não foi aprovada. Envie outra imagem.' END,
    'moderation', '/painel/perfil', 'normal', 'photo_request', NEW.id,
    'photo:' || NEW.id::text || ':' || NEW.status
  );
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS photo_requests_notify_review ON public.professional_photo_requests;
CREATE TRIGGER photo_requests_notify_review
  AFTER UPDATE ON public.professional_photo_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_pro_on_photo_review();

-- 5) Subscription activated / renewed -> professional
CREATE OR REPLACE FUNCTION public.tg_notify_pro_on_subscription_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_user uuid; v_plan text;
BEGIN
  IF NEW.status::text <> 'active' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status::text = 'active'
     AND NEW.expires_at IS NOT DISTINCT FROM OLD.expires_at THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_user FROM public.professional_profiles WHERE id = NEW.professional_id;
  IF v_user IS NULL THEN RETURN NEW; END IF;
  SELECT name INTO v_plan FROM public.plans WHERE id = NEW.plan_id;

  INSERT INTO public.notifications (user_id, title, message, type, link, priority, entity_type, entity_id, dedupe_key)
  VALUES (
    v_user, 'Plano ativo 🎉',
    'Seu plano ' || COALESCE(v_plan,'') || ' está ativo' ||
      CASE WHEN NEW.expires_at IS NOT NULL THEN ' até ' || to_char(NEW.expires_at,'DD/MM/YYYY') ELSE '' END || '.',
    'system', '/painel/assinatura', 'high', 'subscription', NEW.id,
    'sub_active:' || NEW.id::text || ':' || COALESCE(to_char(NEW.expires_at,'YYYYMMDD'),'na')
  );
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS subscriptions_notify_active ON public.subscriptions;
CREATE TRIGGER subscriptions_notify_active
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_pro_on_subscription_active();

-- 6) New professional profile -> admins
CREATE OR REPLACE FUNCTION public.tg_notify_admins_new_professional()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE a uuid; v_name text;
BEGIN
  v_name := COALESCE(NEW.business_name, NEW.professional_name, 'Novo profissional');
  FOR a IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link, priority, entity_type, entity_id, dedupe_key)
    VALUES (a, 'Novo profissional cadastrado', v_name || ' criou um perfil na plataforma.',
      'system', '/admin/profissionais/' || NEW.id::text, 'normal', 'professional_profile', NEW.id,
      'new_pro:' || NEW.id::text);
  END LOOP;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS professional_profiles_notify_admins ON public.professional_profiles;
CREATE TRIGGER professional_profiles_notify_admins
  AFTER INSERT ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_admins_new_professional();

-- 7) Enrich existing notifications with entity metadata + priority
CREATE OR REPLACE FUNCTION public.tg_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_conv public.conversations%ROWTYPE;
  v_recipient uuid;
  v_preview text;
BEGIN
  SELECT * INTO v_conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF v_conv.id IS NULL THEN RETURN NEW; END IF;

  v_preview := COALESCE(NULLIF(NEW.body, ''), '📎 ' || COALESCE(NEW.attachment_name, 'anexo'));
  v_preview := left(v_preview, 200);

  IF NEW.sender_id = v_conv.client_id THEN
    v_recipient := v_conv.professional_user_id;
    UPDATE public.conversations
      SET last_message_at = NEW.created_at, last_message_preview = v_preview,
          pro_unread_count = pro_unread_count + 1
      WHERE id = v_conv.id;
  ELSE
    v_recipient := v_conv.client_id;
    UPDATE public.conversations
      SET last_message_at = NEW.created_at, last_message_preview = v_preview,
          client_unread_count = client_unread_count + 1
      WHERE id = v_conv.id;
  END IF;

  IF v_recipient IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link, priority, entity_type, entity_id)
    VALUES (v_recipient, 'Nova mensagem', v_preview, 'message_new',
      '/painel/mensagens/' || v_conv.id::text, 'high', 'conversation', v_conv.id);
  END IF;

  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.tg_notify_client_on_proposal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_client uuid; v_title text; v_pro_name text;
BEGIN
  SELECT client_id, title INTO v_client, v_title
    FROM public.quote_requests WHERE id = NEW.quote_request_id;
  SELECT COALESCE(professional_name, business_name, 'Um profissional') INTO v_pro_name
    FROM public.professional_profiles WHERE id = NEW.professional_id;
  IF v_client IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link, priority, entity_type, entity_id, dedupe_key)
    VALUES (v_client, 'Nova proposta recebida',
      v_pro_name || ' enviou uma proposta para "' || v_title || '"',
      'proposal'::notification_type, '/painel/pedidos/' || NEW.quote_request_id::text,
      'high', 'quote_proposal', NEW.id, 'proposal:' || NEW.id::text);
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.tg_notify_pro_on_direct_quote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_pro_user uuid;
BEGIN
  IF NEW.selected_professional_id IS NULL THEN RETURN NEW; END IF;
  SELECT user_id INTO v_pro_user FROM public.professional_profiles
   WHERE id = NEW.selected_professional_id;
  IF v_pro_user IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, title, message, type, link, priority, entity_type, entity_id, dedupe_key)
  VALUES (v_pro_user, 'Novo pedido de orçamento',
    'Você recebeu uma nova solicitação de orçamento pelo seu perfil público: "' || NEW.title || '"',
    'opportunity'::notification_type, '/painel/orcamentos/' || NEW.id::text,
    'high', 'quote_request', NEW.id, 'direct_quote:' || NEW.id::text);
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.tg_notify_pro_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_pro_user uuid;
BEGIN
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT user_id INTO v_pro_user
      FROM public.professional_profiles WHERE id = NEW.professional_id;
    IF v_pro_user IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link, priority, entity_type, entity_id, dedupe_key)
      VALUES (v_pro_user, 'Nova avaliação recebida',
        'Você recebeu uma avaliação ' || NEW.rating || '★',
        'review_new', '/painel', 'normal', 'review', NEW.id, 'review:' || NEW.id::text);
    END IF;
  END IF;
  RETURN NEW;
END $function$;
