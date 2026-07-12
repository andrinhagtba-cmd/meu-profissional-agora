
-- Notify professional when a client creates a quote directly targeted to them.
CREATE OR REPLACE FUNCTION public.tg_notify_pro_on_direct_quote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pro_user uuid;
  v_pro_name text;
BEGIN
  IF NEW.selected_professional_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id, COALESCE(professional_name, business_name, 'Profissional')
    INTO v_pro_user, v_pro_name
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
    '/painel/pedidos/' || NEW.id::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_pro_on_direct_quote ON public.quote_requests;
CREATE TRIGGER trg_notify_pro_on_direct_quote
AFTER INSERT ON public.quote_requests
FOR EACH ROW
EXECUTE FUNCTION public.tg_notify_pro_on_direct_quote();
