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

  IF nullif(trim(p_endpoint), '') IS NULL
     OR nullif(trim(p_p256dh), '') IS NULL
     OR nullif(trim(p_auth), '') IS NULL THEN
    RAISE EXCEPTION 'Invalid push subscription' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  INSERT INTO public.push_subscriptions AS ps (
    user_id,
    endpoint,
    p256dh,
    auth,
    device_label,
    platform,
    browser,
    user_agent,
    status,
    failure_count,
    last_error,
    last_used_at
  )
  VALUES (
    v_user_id,
    p_endpoint,
    p_p256dh,
    p_auth,
    p_device_label,
    p_platform,
    p_browser,
    left(coalesce(p_user_agent, ''), 400),
    'active',
    0,
    NULL,
    now()
  )
  ON CONFLICT ON CONSTRAINT push_subscriptions_endpoint_key
  DO UPDATE SET
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
  RETURNING ps.id, ps.status, ps.endpoint;
END
$function$;

REVOKE ALL ON FUNCTION public.register_my_push_subscription(text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_my_push_subscription(text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_my_push_subscription(text, text, text, text, text, text, text) TO service_role;