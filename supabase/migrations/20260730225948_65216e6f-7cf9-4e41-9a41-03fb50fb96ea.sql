CREATE OR REPLACE FUNCTION public.tg_notifications_dispatch_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'net'
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
    UPDATE public.notifications SET push_status = 'failed' WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := v_url,
      body := jsonb_build_object('notificationId', NEW.id),
      params := '{}'::jsonb,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret),
      timeout_milliseconds := 8000
    );
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.notifications
    SET push_status = 'failed'
    WHERE id = NEW.id;
  END;
  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.register_my_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_device_label text,
  p_platform text,
  p_browser text,
  p_user_agent text
)
RETURNS TABLE(id uuid, status text, endpoint text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF nullif(trim(p_endpoint), '') IS NULL OR nullif(trim(p_p256dh), '') IS NULL OR nullif(trim(p_auth), '') IS NULL THEN
    RAISE EXCEPTION 'Invalid push subscription' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  INSERT INTO public.push_subscriptions (
    user_id, endpoint, p256dh, auth, device_label, platform, browser, user_agent,
    status, failure_count, last_error, last_used_at
  )
  VALUES (
    v_user_id, p_endpoint, p_p256dh, p_auth, p_device_label, p_platform, p_browser,
    left(coalesce(p_user_agent, ''), 400), 'active', 0, NULL, now()
  )
  ON CONFLICT (endpoint) DO UPDATE SET
    user_id = v_user_id,
    p256dh = EXCLUDED.p256dh,
    auth = EXCLUDED.auth,
    device_label = EXCLUDED.device_label,
    platform = EXCLUDED.platform,
    browser = EXCLUDED.browser,
    user_agent = EXCLUDED.user_agent,
    status = 'active',
    failure_count = 0,
    last_error = NULL,
    last_used_at = now()
  RETURNING push_subscriptions.id, push_subscriptions.status, push_subscriptions.endpoint;
END
$function$;

REVOKE ALL ON FUNCTION public.register_my_push_subscription(text, text, text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_my_push_subscription(text, text, text, text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.register_my_push_subscription(text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_my_push_subscription(text, text, text, text, text, text, text) TO service_role;