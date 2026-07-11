CREATE OR REPLACE FUNCTION public.tg_notify_client_on_proposal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client uuid;
  v_title text;
  v_pro_name text;
BEGIN
  SELECT client_id, title INTO v_client, v_title
    FROM public.quote_requests WHERE id = NEW.quote_request_id;
  SELECT COALESCE(professional_name, business_name, 'Um profissional') INTO v_pro_name
    FROM public.professional_profiles WHERE id = NEW.professional_id;
  IF v_client IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_client,
      'Nova proposta recebida',
      v_pro_name || ' enviou uma proposta para "' || v_title || '"',
      'proposal'::notification_type,
      '/painel/pedidos/' || NEW.quote_request_id::text
    );
  END IF;
  RETURN NEW;
END $$;