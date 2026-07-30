-- ============ EXTENSÕES ============
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============ CONFIG INTERNA (server-only) ============
CREATE TABLE IF NOT EXISTS public.app_private_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.app_private_config FROM anon, authenticated;
GRANT ALL ON public.app_private_config TO service_role;
ALTER TABLE public.app_private_config ENABLE ROW LEVEL SECURITY;

-- ============ PUSH SUBSCRIPTIONS ============
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  device_label text,
  platform text,
  browser text,
  user_agent text,
  status text NOT NULL DEFAULT 'active',
  failure_count integer NOT NULL DEFAULT 0,
  last_error text,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_status_chk CHECK (status IN ('active','expired','revoked'))
);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subs_own_all" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_subs_admin_select" ON public.push_subscriptions
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_push_subs_updated_at BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ PREFERÊNCIAS ============
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY,
  push_enabled boolean NOT NULL DEFAULT true,
  inapp_enabled boolean NOT NULL DEFAULT true,
  push_messages boolean NOT NULL DEFAULT true,
  push_quotes boolean NOT NULL DEFAULT true,
  push_proposals boolean NOT NULL DEFAULT true,
  push_reviews boolean NOT NULL DEFAULT true,
  push_subscription boolean NOT NULL DEFAULT true,
  push_moderation boolean NOT NULL DEFAULT true,
  push_system boolean NOT NULL DEFAULT true,
  quiet_hours_start smallint,
  quiet_hours_end smallint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_prefs_own" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_notif_prefs_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ LOG DE ENTREGAS ============
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.push_subscriptions(id) ON DELETE SET NULL,
  endpoint text,
  status text NOT NULL DEFAULT 'queued',
  http_status integer,
  error text,
  attempt integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notif_deliveries_status_chk CHECK (status IN ('queued','sent','failed','expired','skipped'))
);
CREATE INDEX IF NOT EXISTS idx_notif_deliveries_user ON public.notification_deliveries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_deliveries_notif ON public.notification_deliveries(notification_id);

GRANT SELECT ON public.notification_deliveries TO authenticated;
GRANT ALL ON public.notification_deliveries TO service_role;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_deliveries_own_select" ON public.notification_deliveries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============ AMPLIA notifications ============
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS dedupe_key text,
  ADD COLUMN IF NOT EXISTS push_status text NOT NULL DEFAULT 'pending';

UPDATE public.notifications SET read_at = created_at WHERE read = true AND read_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_dedupe
  ON public.notifications(user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;

-- mantém read e read_at coerentes
CREATE OR REPLACE FUNCTION public.tg_notifications_sync_read()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.read_at IS NOT NULL THEN
    NEW.read := true;
  ELSIF NEW.read = true AND (TG_OP = 'INSERT' OR OLD.read IS DISTINCT FROM NEW.read) THEN
    NEW.read_at := COALESCE(NEW.read_at, now());
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notifications_sync_read
  BEFORE INSERT OR UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.tg_notifications_sync_read();

-- ============ CORRIGE mark_pro_quote_viewed ============
CREATE OR REPLACE FUNCTION public.mark_pro_quote_viewed(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.quote_requests
     SET pro_viewed_at = COALESCE(pro_viewed_at, now())
   WHERE id = _id
     AND selected_professional_id IN (
       SELECT id FROM public.professional_profiles WHERE user_id = auth.uid()
     );

  UPDATE public.notifications
     SET read = true, read_at = COALESCE(read_at, now())
   WHERE user_id = auth.uid()
     AND type = 'opportunity'
     AND link = '/painel/orcamentos/' || _id::text;
END $$;

-- ============ MAPA TIPO -> PREFERÊNCIA ============
CREATE OR REPLACE FUNCTION public.notification_push_allowed(_user_id uuid, _type text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT p.push_enabled AND CASE
      WHEN _type IN ('message','message_new') THEN p.push_messages
      WHEN _type IN ('opportunity','quote_status') THEN p.push_quotes
      WHEN _type IN ('proposal','proposal_accepted','proposal_rejected') THEN p.push_proposals
      WHEN _type IN ('review','review_new') THEN p.push_reviews
      WHEN _type = 'moderation' THEN p.push_moderation
      ELSE p.push_system
    END
    FROM public.notification_preferences p WHERE p.user_id = _user_id
  ), true);
$$;

-- ============ DISPARO AUTOMÁTICO ============
CREATE OR REPLACE FUNCTION public.tg_notifications_dispatch_push()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text;
  v_secret text;
BEGIN
  IF NOT public.notification_push_allowed(NEW.user_id, NEW.type::text) THEN
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
END $$;

CREATE TRIGGER trg_notifications_dispatch_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.tg_notifications_dispatch_push();