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
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type','application/json','x-push-secret', v_secret),
      body := jsonb_build_object('notificationId', NEW.id),
      timeout_milliseconds := 8000
    );
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.notifications SET push_status = 'failed' WHERE id = NEW.id;
  END;
  RETURN NEW;
END $function$;