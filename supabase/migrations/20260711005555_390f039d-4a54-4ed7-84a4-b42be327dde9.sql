
-- Trigger: notificar cliente quando profissional envia nova proposta
CREATE OR REPLACE FUNCTION public.tg_notify_client_on_proposal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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
      'proposal_new',
      '/painel/pedidos/' || NEW.quote_request_id::text
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_new_proposal_notify_client ON public.quote_proposals;
CREATE TRIGGER on_new_proposal_notify_client
AFTER INSERT ON public.quote_proposals
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_client_on_proposal();

-- Função: cliente aceita uma proposta (marca aceita, rejeita as demais, notifica pros)
CREATE OR REPLACE FUNCTION public.accept_proposal(_proposal_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_quote_id uuid;
  v_client uuid;
  v_pro_id uuid;
  v_quote_title text;
  r RECORD;
BEGIN
  SELECT p.quote_request_id, q.client_id, p.professional_id, q.title
    INTO v_quote_id, v_client, v_pro_id, v_quote_title
    FROM public.quote_proposals p
    JOIN public.quote_requests q ON q.id = p.quote_request_id
    WHERE p.id = _proposal_id;

  IF v_quote_id IS NULL THEN
    RAISE EXCEPTION 'Proposal not found';
  END IF;
  IF v_client <> auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.quote_proposals
    SET status = 'accepted'
    WHERE id = _proposal_id;

  UPDATE public.quote_proposals
    SET status = 'rejected'
    WHERE quote_request_id = v_quote_id AND id <> _proposal_id AND status NOT IN ('rejected','withdrawn');

  UPDATE public.quote_requests
    SET status = 'professional_selected', selected_professional_id = v_pro_id
    WHERE id = v_quote_id;

  -- Notifica o profissional aceito
  FOR r IN
    SELECT user_id FROM public.professional_profiles WHERE id = v_pro_id AND user_id IS NOT NULL
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (r.user_id, 'Sua proposta foi aceita!',
      'O cliente aceitou sua proposta em "' || v_quote_title || '"',
      'proposal_accepted', '/painel/propostas');
  END LOOP;

  -- Notifica os demais profissionais
  FOR r IN
    SELECT pp.user_id
      FROM public.quote_proposals qp
      JOIN public.professional_profiles pp ON pp.id = qp.professional_id
     WHERE qp.quote_request_id = v_quote_id
       AND qp.id <> _proposal_id
       AND pp.user_id IS NOT NULL
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (r.user_id, 'Proposta não selecionada',
      'O cliente escolheu outro profissional em "' || v_quote_title || '"',
      'proposal_rejected', '/painel/propostas');
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.accept_proposal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_proposal(uuid) TO authenticated;

-- Função: cliente descarta (marca como rejeitada) uma proposta sem escolher outra
CREATE OR REPLACE FUNCTION public.reject_proposal(_proposal_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_client uuid;
  v_pro_user uuid;
  v_quote_title text;
BEGIN
  SELECT q.client_id, pp.user_id, q.title
    INTO v_client, v_pro_user, v_quote_title
    FROM public.quote_proposals p
    JOIN public.quote_requests q ON q.id = p.quote_request_id
    JOIN public.professional_profiles pp ON pp.id = p.professional_id
   WHERE p.id = _proposal_id;

  IF v_client IS NULL THEN
    RAISE EXCEPTION 'Proposal not found';
  END IF;
  IF v_client <> auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.quote_proposals SET status='rejected' WHERE id = _proposal_id;

  IF v_pro_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (v_pro_user, 'Proposta recusada',
      'O cliente recusou sua proposta em "' || v_quote_title || '"',
      'proposal_rejected', '/painel/propostas');
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.reject_proposal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_proposal(uuid) TO authenticated;
