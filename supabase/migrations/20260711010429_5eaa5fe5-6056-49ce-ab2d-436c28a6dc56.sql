
-- =========================================================
-- CONVERSATIONS
-- =========================================================
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  professional_user_id uuid,
  last_message_at timestamptz,
  last_message_preview text,
  client_unread_count integer NOT NULL DEFAULT 0,
  pro_unread_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quote_request_id, professional_id)
);

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (
    client_id = auth.uid()
    OR professional_user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Participants update conversations"
  ON public.conversations FOR UPDATE TO authenticated
  USING (
    client_id = auth.uid()
    OR professional_user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

CREATE TRIGGER trg_conversations_updated
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_conversations_client ON public.conversations(client_id);
CREATE INDEX idx_conversations_pro_user ON public.conversations(professional_user_id);
CREATE INDEX idx_conversations_quote ON public.conversations(quote_request_id);

-- =========================================================
-- MESSAGES
-- =========================================================
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text,
  attachment_path text,
  attachment_name text,
  attachment_type text,
  attachment_size integer,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.client_id = auth.uid() OR c.professional_user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Participants send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.client_id = auth.uid() OR c.professional_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants mark read"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.client_id = auth.uid() OR c.professional_user_id = auth.uid())
    )
  );

CREATE INDEX idx_messages_conv_created ON public.messages(conversation_id, created_at DESC);

-- =========================================================
-- TRIGGER: on new message -> update conversation + notify
-- =========================================================
CREATE OR REPLACE FUNCTION public.tg_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      SET last_message_at = NEW.created_at,
          last_message_preview = v_preview,
          pro_unread_count = pro_unread_count + 1
      WHERE id = v_conv.id;
  ELSE
    v_recipient := v_conv.client_id;
    UPDATE public.conversations
      SET last_message_at = NEW.created_at,
          last_message_preview = v_preview,
          client_unread_count = client_unread_count + 1
      WHERE id = v_conv.id;
  END IF;

  IF v_recipient IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_recipient,
      'Nova mensagem',
      v_preview,
      'message_new',
      '/painel/mensagens/' || v_conv.id::text
    );
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.tg_on_new_message();

-- =========================================================
-- RPC: get_or_create_conversation
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(_quote_id uuid, _pro_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client uuid;
  v_selected uuid;
  v_pro_user uuid;
  v_conv_id uuid;
BEGIN
  SELECT client_id, selected_professional_id
    INTO v_client, v_selected
    FROM public.quote_requests
    WHERE id = _quote_id;

  IF v_client IS NULL THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;

  SELECT user_id INTO v_pro_user FROM public.professional_profiles WHERE id = _pro_id;

  -- Authorization: caller must be the client, the pro, or admin
  IF auth.uid() <> v_client
     AND (v_pro_user IS NULL OR auth.uid() <> v_pro_user)
     AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Only open chat when the pro is the selected one (or accepted proposal exists)
  IF v_selected IS NULL OR v_selected <> _pro_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.quote_proposals
       WHERE quote_request_id = _quote_id
         AND professional_id = _pro_id
         AND status = 'accepted'
    ) THEN
      RAISE EXCEPTION 'Chat available only after proposal is accepted';
    END IF;
  END IF;

  SELECT id INTO v_conv_id FROM public.conversations
    WHERE quote_request_id = _quote_id AND professional_id = _pro_id;

  IF v_conv_id IS NULL THEN
    INSERT INTO public.conversations (quote_request_id, client_id, professional_id, professional_user_id)
    VALUES (_quote_id, v_client, _pro_id, v_pro_user)
    RETURNING id INTO v_conv_id;
  END IF;

  RETURN v_conv_id;
END $$;

REVOKE ALL ON FUNCTION public.get_or_create_conversation(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid, uuid) TO authenticated;

-- =========================================================
-- RPC: mark_conversation_read
-- =========================================================
CREATE OR REPLACE FUNCTION public.mark_conversation_read(_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.conversations%ROWTYPE;
BEGIN
  SELECT * INTO v_conv FROM public.conversations WHERE id = _conversation_id;
  IF v_conv.id IS NULL THEN RETURN; END IF;

  IF auth.uid() = v_conv.client_id THEN
    UPDATE public.conversations SET client_unread_count = 0 WHERE id = _conversation_id;
    UPDATE public.messages SET read_at = now()
      WHERE conversation_id = _conversation_id
        AND sender_id <> auth.uid() AND read_at IS NULL;
  ELSIF auth.uid() = v_conv.professional_user_id THEN
    UPDATE public.conversations SET pro_unread_count = 0 WHERE id = _conversation_id;
    UPDATE public.messages SET read_at = now()
      WHERE conversation_id = _conversation_id
        AND sender_id <> auth.uid() AND read_at IS NULL;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.mark_conversation_read(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;

-- =========================================================
-- Auto-open conversation when proposal is accepted
-- =========================================================
CREATE OR REPLACE FUNCTION public.tg_open_conv_on_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client uuid;
  v_pro_user uuid;
BEGIN
  IF NEW.status = 'accepted' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT client_id INTO v_client FROM public.quote_requests WHERE id = NEW.quote_request_id;
    SELECT user_id INTO v_pro_user FROM public.professional_profiles WHERE id = NEW.professional_id;

    IF v_client IS NOT NULL THEN
      INSERT INTO public.conversations (quote_request_id, client_id, professional_id, professional_user_id)
      VALUES (NEW.quote_request_id, v_client, NEW.professional_id, v_pro_user)
      ON CONFLICT (quote_request_id, professional_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_proposal_accepted_open_conv
  AFTER INSERT OR UPDATE OF status ON public.quote_proposals
  FOR EACH ROW EXECUTE FUNCTION public.tg_open_conv_on_accept();

-- =========================================================
-- Realtime
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
