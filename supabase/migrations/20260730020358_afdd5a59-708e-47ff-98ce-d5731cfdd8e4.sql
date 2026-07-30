-- 1) novo status
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'suspended';

-- 2) colunas na tabela subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS grace_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS renewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS activated_by uuid,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions (expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_professional ON public.subscriptions (professional_id);

-- 3) histórico de eventos
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.subscription_events TO authenticated;
GRANT ALL ON public.subscription_events TO service_role;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage subscription events" ON public.subscription_events
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "pros read own subscription events" ON public.subscription_events
  FOR SELECT TO authenticated USING (
    professional_id IN (SELECT id FROM public.professional_profiles WHERE user_id = auth.uid())
  );
CREATE INDEX IF NOT EXISTS idx_sub_events_sub ON public.subscription_events (subscription_id, created_at DESC);

-- 4) notificações de assinatura
CREATE TABLE IF NOT EXISTS public.subscription_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  offset_days integer NOT NULL,
  channel text NOT NULL DEFAULT 'in_app',
  recipient text,
  status text NOT NULL DEFAULT 'sent',
  message text,
  error text,
  expires_at_snapshot timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sub_notif_cycle
  ON public.subscription_notifications (subscription_id, offset_days, channel, expires_at_snapshot);
GRANT SELECT, INSERT ON public.subscription_notifications TO authenticated;
GRANT ALL ON public.subscription_notifications TO service_role;
ALTER TABLE public.subscription_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage subscription notifications" ON public.subscription_notifications
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "pros read own subscription notifications" ON public.subscription_notifications
  FOR SELECT TO authenticated USING (
    professional_id IN (SELECT id FROM public.professional_profiles WHERE user_id = auth.uid())
  );

-- 5) configurações de cobrança
CREATE TABLE IF NOT EXISTS public.subscription_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  alert_offsets integer[] NOT NULL DEFAULT ARRAY[30,15,7,3,1,0,-1,-7],
  expiry_behavior text NOT NULL DEFAULT 'grace',
  grace_days integer NOT NULL DEFAULT 7,
  notify_admins boolean NOT NULL DEFAULT true,
  notify_clients boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_settings TO authenticated;
GRANT INSERT, UPDATE ON public.subscription_settings TO authenticated;
GRANT ALL ON public.subscription_settings TO service_role;
ALTER TABLE public.subscription_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "everyone authenticated reads subscription settings" ON public.subscription_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write subscription settings" ON public.subscription_settings
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_subscription_settings_updated BEFORE UPDATE ON public.subscription_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.subscription_settings (singleton) VALUES (true) ON CONFLICT (singleton) DO NOTHING;

-- 6) RLS extra em subscriptions: profissional lê a própria
DROP POLICY IF EXISTS "pros read own subscriptions" ON public.subscriptions;
CREATE POLICY "pros read own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (
    professional_id IN (SELECT id FROM public.professional_profiles WHERE user_id = auth.uid())
  );

-- 7) cálculo de vencimento conforme duração do plano
CREATE OR REPLACE FUNCTION public.plan_expiry_from(_start timestamptz, _billing_period text)
RETURNS timestamptz LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE p text := lower(coalesce(_billing_period,'')); d int;
BEGIN
  IF _start IS NULL THEN RETURN NULL; END IF;
  IF p ~ '^custom:[0-9]+$' THEN
    d := split_part(p, ':', 2)::int;
    RETURN _start + make_interval(days => d);
  END IF;
  IF p IN ('one_time','custom','lifetime') THEN RETURN NULL; END IF;
  IF p LIKE '%year%' OR p LIKE '%anual%' THEN RETURN _start + interval '12 months'; END IF;
  IF p LIKE '%semi%' OR p LIKE '%semes%' THEN RETURN _start + interval '6 months'; END IF;
  IF p LIKE '%quarter%' OR p LIKE '%trimes%' THEN RETURN _start + interval '3 months'; END IF;
  IF p LIKE '%week%' OR p LIKE '%semana%' THEN RETURN _start + interval '7 days'; END IF;
  RETURN _start + interval '1 month';
END $$;

-- 8) ativar assinatura + profissional
CREATE OR REPLACE FUNCTION public.admin_activate_subscription(
  _subscription_id uuid,
  _activation_at timestamptz DEFAULT now(),
  _expires_at timestamptz DEFAULT NULL,
  _publish_profile boolean DEFAULT true,
  _note text DEFAULT NULL
) RETURNS public.subscriptions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.subscriptions; v_period text; v_exp timestamptz; v_grace int; v_pro_user uuid; v_name text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Não autorizado'; END IF;
  SELECT * INTO s FROM public.subscriptions WHERE id = _subscription_id;
  IF s.id IS NULL THEN RAISE EXCEPTION 'Assinatura não encontrada'; END IF;

  SELECT billing_period INTO v_period FROM public.plans WHERE id = s.plan_id;
  v_exp := COALESCE(_expires_at, public.plan_expiry_from(_activation_at, v_period));
  SELECT grace_days INTO v_grace FROM public.subscription_settings WHERE singleton;

  UPDATE public.subscriptions
     SET status = 'active',
         started_at = COALESCE(started_at, _activation_at),
         activated_at = _activation_at,
         activated_by = auth.uid(),
         expires_at = v_exp,
         grace_period_end = CASE WHEN v_exp IS NULL THEN NULL ELSE v_exp + make_interval(days => COALESCE(v_grace,0)) END,
         suspended_at = NULL, cancelled_at = NULL,
         updated_at = now()
   WHERE id = _subscription_id
   RETURNING * INTO s;

  IF _publish_profile THEN
    UPDATE public.professional_profiles SET profile_status = 'published' WHERE id = s.professional_id;
  END IF;

  INSERT INTO public.subscription_events (subscription_id, professional_id, event_type, to_status, note, actor_user_id, metadata)
  VALUES (s.id, s.professional_id, 'activated', 'active', _note, auth.uid(),
          jsonb_build_object('expires_at', v_exp, 'activated_at', _activation_at));

  SELECT user_id, COALESCE(business_name, professional_name, 'Profissional')
    INTO v_pro_user, v_name FROM public.professional_profiles WHERE id = s.professional_id;
  IF v_pro_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (v_pro_user, 'Seu plano foi ativado',
      CASE WHEN v_exp IS NULL THEN 'Seu perfil está ativo no Guia DF na Mídia.'
           ELSE 'Seu perfil está ativo. Sua assinatura vence em ' || to_char(v_exp, 'DD/MM/YYYY') || '.' END,
      'system', '/painel');
  END IF;

  RETURN s;
END $$;

-- 9) suspender / cancelar / reativar perfil
CREATE OR REPLACE FUNCTION public.admin_set_subscription_status(
  _subscription_id uuid, _status text, _note text DEFAULT NULL
) RETURNS public.subscriptions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.subscriptions; v_from text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Não autorizado'; END IF;
  IF _status NOT IN ('active','pending','suspended','cancelled','expired') THEN
    RAISE EXCEPTION 'Status inválido';
  END IF;
  SELECT status::text INTO v_from FROM public.subscriptions WHERE id = _subscription_id;
  IF v_from IS NULL THEN RAISE EXCEPTION 'Assinatura não encontrada'; END IF;

  UPDATE public.subscriptions
     SET status = _status::public.subscription_status,
         suspended_at = CASE WHEN _status = 'suspended' THEN now() ELSE NULL END,
         cancelled_at = CASE WHEN _status = 'cancelled' THEN now() ELSE NULL END,
         updated_at = now()
   WHERE id = _subscription_id RETURNING * INTO s;

  IF _status IN ('suspended','cancelled') THEN
    UPDATE public.professional_profiles SET profile_status = 'draft' WHERE id = s.professional_id;
  END IF;

  INSERT INTO public.subscription_events (subscription_id, professional_id, event_type, from_status, to_status, note, actor_user_id)
  VALUES (s.id, s.professional_id, 'status_changed', v_from, _status, _note, auth.uid());
  RETURN s;
END $$;

-- 10) renovação preservando histórico
CREATE OR REPLACE FUNCTION public.admin_renew_subscription(
  _subscription_id uuid,
  _plan_id uuid DEFAULT NULL,
  _start_date timestamptz DEFAULT NULL,
  _expires_at timestamptz DEFAULT NULL,
  _amount numeric DEFAULT NULL,
  _payment_method text DEFAULT NULL,
  _payment_status text DEFAULT NULL,
  _note text DEFAULT NULL,
  _reactivate boolean DEFAULT true
) RETURNS public.subscriptions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.subscriptions; v_plan uuid; v_period text; v_start timestamptz; v_exp timestamptz; v_grace int; v_pro_user uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Não autorizado'; END IF;
  SELECT * INTO s FROM public.subscriptions WHERE id = _subscription_id;
  IF s.id IS NULL THEN RAISE EXCEPTION 'Assinatura não encontrada'; END IF;

  v_plan := COALESCE(_plan_id, s.plan_id);
  SELECT billing_period INTO v_period FROM public.plans WHERE id = v_plan;
  v_start := COALESCE(_start_date, GREATEST(COALESCE(s.expires_at, now()), now()));
  v_exp := COALESCE(_expires_at, public.plan_expiry_from(v_start, v_period));
  SELECT grace_days INTO v_grace FROM public.subscription_settings WHERE singleton;

  INSERT INTO public.subscription_events (subscription_id, professional_id, event_type, from_status, to_status, note, actor_user_id, metadata)
  VALUES (s.id, s.professional_id, 'renewed', s.status::text, 'active', _note, auth.uid(),
    jsonb_build_object(
      'previous_plan_id', s.plan_id, 'new_plan_id', v_plan,
      'previous_started_at', s.started_at, 'previous_expires_at', s.expires_at,
      'new_started_at', v_start, 'new_expires_at', v_exp,
      'amount', _amount, 'payment_method', _payment_method));

  UPDATE public.subscriptions
     SET plan_id = v_plan,
         status = 'active',
         started_at = v_start,
         activated_at = COALESCE(s.activated_at, v_start),
         renewed_at = now(),
         expires_at = v_exp,
         grace_period_end = CASE WHEN v_exp IS NULL THEN NULL ELSE v_exp + make_interval(days => COALESCE(v_grace,0)) END,
         amount = COALESCE(_amount, s.amount),
         payment_method = COALESCE(_payment_method, s.payment_method),
         payment_status = COALESCE(_payment_status, s.payment_status),
         suspended_at = NULL, cancelled_at = NULL,
         updated_at = now()
   WHERE id = _subscription_id RETURNING * INTO s;

  IF _reactivate THEN
    UPDATE public.professional_profiles SET profile_status = 'published' WHERE id = s.professional_id;
  END IF;

  SELECT user_id INTO v_pro_user FROM public.professional_profiles WHERE id = s.professional_id;
  IF v_pro_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (v_pro_user, 'Assinatura renovada',
      'Sua assinatura foi renovada' || CASE WHEN v_exp IS NULL THEN '.' ELSE ' e vence em ' || to_char(v_exp,'DD/MM/YYYY') || '.' END,
      'system', '/painel');
  END IF;
  RETURN s;
END $$;

-- 11) rotina diária
CREATE OR REPLACE FUNCTION public.process_subscription_lifecycle()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cfg public.subscription_settings;
  r RECORD; v_days int; v_msg text; v_pro_user uuid; v_name text;
  n_expired int := 0; n_notified int := 0; n_deactivated int := 0; a uuid;
BEGIN
  SELECT * INTO cfg FROM public.subscription_settings WHERE singleton;

  -- marca vencidas (não sobrescreve suspensa/cancelada)
  UPDATE public.subscriptions
     SET status = 'expired', updated_at = now()
   WHERE expires_at IS NOT NULL AND expires_at < now()
     AND status::text = 'active';
  GET DIAGNOSTICS n_expired = ROW_COUNT;

  -- tolerância / desativação
  IF cfg.expiry_behavior IN ('deactivate','grace') THEN
    FOR r IN
      SELECT s.id, s.professional_id, s.grace_period_end, s.expires_at
        FROM public.subscriptions s
       WHERE s.status::text = 'expired'
         AND s.expires_at IS NOT NULL
         AND (cfg.expiry_behavior = 'deactivate' OR COALESCE(s.grace_period_end, s.expires_at) < now())
    LOOP
      UPDATE public.professional_profiles
         SET profile_status = 'draft', is_featured = false
       WHERE id = r.professional_id AND profile_status = 'published';
      IF FOUND THEN
        n_deactivated := n_deactivated + 1;
        INSERT INTO public.subscription_events (subscription_id, professional_id, event_type, to_status, note)
        VALUES (r.id, r.professional_id, 'auto_deactivated', 'expired', 'Perfil despublicado após vencimento');
      END IF;
    END LOOP;
  END IF;

  -- notificações
  FOR r IN
    SELECT s.id, s.professional_id, s.expires_at, p.user_id, p.business_name, p.professional_name
      FROM public.subscriptions s
      JOIN public.professional_profiles p ON p.id = s.professional_id
     WHERE s.expires_at IS NOT NULL
       AND s.status::text IN ('active','expired')
  LOOP
    v_days := (r.expires_at::date - (now() AT TIME ZONE 'UTC')::date);
    IF NOT (v_days = ANY (cfg.alert_offsets)) THEN CONTINUE; END IF;

    v_name := COALESCE(r.business_name, r.professional_name, 'Profissional');
    v_msg := CASE
      WHEN v_days > 0 THEN 'A assinatura de ' || v_name || ' vence em ' || v_days || ' dia(s) — ' || to_char(r.expires_at,'DD/MM/YYYY') || '.'
      WHEN v_days = 0 THEN 'A assinatura de ' || v_name || ' vence hoje.'
      ELSE 'A assinatura de ' || v_name || ' venceu há ' || abs(v_days) || ' dia(s).' END;

    BEGIN
      INSERT INTO public.subscription_notifications
        (subscription_id, professional_id, offset_days, channel, recipient, status, message, expires_at_snapshot)
      VALUES (r.id, r.professional_id, v_days, 'in_app', r.user_id::text, 'sent', v_msg, r.expires_at);
    EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;
    n_notified := n_notified + 1;

    IF cfg.notify_clients AND r.user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (r.user_id, CASE WHEN v_days < 0 THEN 'Assinatura vencida' WHEN v_days = 0 THEN 'Sua assinatura vence hoje' ELSE 'Sua assinatura está próxima do vencimento' END,
        CASE
          WHEN v_days > 0 THEN 'Seu plano vence em ' || v_days || ' dia(s). Entre em contato para renovar.'
          WHEN v_days = 0 THEN 'Seu plano vence hoje. Entre em contato para renovar.'
          ELSE 'Seu plano venceu em ' || to_char(r.expires_at,'DD/MM/YYYY') || '. Renove para manter seu perfil ativo.' END,
        'system', '/painel');
    END IF;

    IF cfg.notify_admins THEN
      FOR a IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (a, 'Assinatura próxima do vencimento', v_msg, 'system', '/admin/assinaturas');
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('expired', n_expired, 'notified', n_notified, 'deactivated', n_deactivated, 'ran_at', now());
END $$;

REVOKE ALL ON FUNCTION public.process_subscription_lifecycle() FROM public;
GRANT EXECUTE ON FUNCTION public.process_subscription_lifecycle() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_activate_subscription(uuid, timestamptz, timestamptz, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_subscription_status(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_renew_subscription(uuid, uuid, timestamptz, timestamptz, numeric, text, text, text, boolean) TO authenticated;