
-- 1) Allow the selected professional to read their assigned quote in any status
CREATE POLICY "selected pro reads own quote"
  ON public.quote_requests FOR SELECT
  USING (
    selected_professional_id IS NOT NULL
    AND selected_professional_id IN (
      SELECT id FROM public.professional_profiles WHERE user_id = auth.uid()
    )
  );

-- 2) Order status history
CREATE TABLE public.quote_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid,
  actor_role text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quote_status_history_quote_idx ON public.quote_status_history(quote_request_id, created_at DESC);

GRANT SELECT, INSERT ON public.quote_status_history TO authenticated;
GRANT ALL ON public.quote_status_history TO service_role;

ALTER TABLE public.quote_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "history: participants can read"
  ON public.quote_status_history FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.quote_requests q
      WHERE q.id = quote_status_history.quote_request_id
        AND (
          q.client_id = auth.uid()
          OR (
            q.selected_professional_id IS NOT NULL
            AND q.selected_professional_id IN (
              SELECT id FROM public.professional_profiles WHERE user_id = auth.uid()
            )
          )
        )
    )
  );

-- Only allow inserts via SECURITY DEFINER RPCs; block direct inserts.
CREATE POLICY "history: no direct insert" ON public.quote_status_history
  FOR INSERT TO authenticated WITH CHECK (false);

-- 3) Trigger to auto-log status changes (works for accept_proposal etc.)
CREATE OR REPLACE FUNCTION public.tg_log_quote_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.quote_status_history (quote_request_id, from_status, to_status, changed_by, actor_role, note)
    VALUES (NEW.id, NULL, NEW.status::text, auth.uid(), 'system', 'Pedido criado');
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.quote_status_history (quote_request_id, from_status, to_status, changed_by, actor_role, note)
    VALUES (NEW.id, OLD.status::text, NEW.status::text, auth.uid(), NULL, NULL);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_quote_status_insert ON public.quote_requests;
CREATE TRIGGER trg_log_quote_status_insert
AFTER INSERT ON public.quote_requests
FOR EACH ROW EXECUTE FUNCTION public.tg_log_quote_status_change();

DROP TRIGGER IF EXISTS trg_log_quote_status_update ON public.quote_requests;
CREATE TRIGGER trg_log_quote_status_update
AFTER UPDATE OF status ON public.quote_requests
FOR EACH ROW EXECUTE FUNCTION public.tg_log_quote_status_change();

-- Backfill: seed a history row per existing quote so timelines are not empty
INSERT INTO public.quote_status_history (quote_request_id, from_status, to_status, changed_by, actor_role, note, created_at)
SELECT id, NULL, status::text, client_id, 'system', 'Pedido criado', created_at
FROM public.quote_requests q
WHERE NOT EXISTS (SELECT 1 FROM public.quote_status_history h WHERE h.quote_request_id = q.id);

-- 4) RPC: update status with state machine + participant notification
CREATE OR REPLACE FUNCTION public.update_quote_status(
  _quote_id uuid,
  _new_status text,
  _note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_quote public.quote_requests%ROWTYPE;
  v_pro_user uuid;
  v_is_client boolean;
  v_is_selected_pro boolean;
  v_is_admin boolean;
  v_allowed boolean := false;
BEGIN
  SELECT * INTO v_quote FROM public.quote_requests WHERE id = _quote_id;
  IF v_quote.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;

  SELECT user_id INTO v_pro_user FROM public.professional_profiles
    WHERE id = v_quote.selected_professional_id;

  v_is_client       := auth.uid() = v_quote.client_id;
  v_is_selected_pro := v_pro_user IS NOT NULL AND auth.uid() = v_pro_user;
  v_is_admin        := public.is_admin(auth.uid());

  IF NOT (v_is_client OR v_is_selected_pro OR v_is_admin) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  -- Terminal states cannot change
  IF v_quote.status::text IN ('completed','cancelled','expired') THEN
    RAISE EXCEPTION 'Este pedido já está finalizado';
  END IF;

  -- State machine
  IF _new_status = 'cancelled' THEN
    v_allowed := v_is_client OR v_is_admin;
  ELSIF _new_status = 'in_progress' THEN
    v_allowed := (v_quote.status::text = 'professional_selected')
      AND (v_is_client OR v_is_selected_pro OR v_is_admin);
  ELSIF _new_status = 'completed' THEN
    v_allowed := (v_quote.status::text IN ('professional_selected','in_progress'))
      AND (v_is_client OR v_is_selected_pro OR v_is_admin);
  ELSE
    RAISE EXCEPTION 'Transição inválida';
  END IF;

  IF NOT v_allowed THEN RAISE EXCEPTION 'Transição não permitida'; END IF;

  UPDATE public.quote_requests SET status = _new_status::quote_status WHERE id = _quote_id;

  -- Enrich the just-logged history row with note + actor_role
  UPDATE public.quote_status_history
     SET note = COALESCE(_note, note),
         actor_role = CASE
           WHEN v_is_client THEN 'client'
           WHEN v_is_selected_pro THEN 'professional'
           WHEN v_is_admin THEN 'admin'
           ELSE actor_role END
   WHERE id = (
     SELECT id FROM public.quote_status_history
      WHERE quote_request_id = _quote_id
      ORDER BY created_at DESC LIMIT 1
   );

  -- Notify the counterparty
  IF v_is_client AND v_pro_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (v_pro_user, 'Status do pedido atualizado',
      'O cliente marcou "' || v_quote.title || '" como ' || _new_status,
      'quote_status', '/painel/trabalhos');
  ELSIF v_is_selected_pro THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (v_quote.client_id, 'Status do pedido atualizado',
      'O profissional marcou "' || v_quote.title || '" como ' || _new_status,
      'quote_status', '/painel/pedidos/' || _quote_id::text);
  END IF;
END $$;
