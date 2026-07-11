
-- Storage policies for chat-attachments bucket
-- Path convention: <conversation_id>/<uuid>.<ext>

CREATE POLICY "Chat participants can read attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.conversations c
         WHERE c.id::text = split_part(name, '/', 1)
           AND (c.client_id = auth.uid() OR c.professional_user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Chat participants can upload attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.conversations c
       WHERE c.id::text = split_part(name, '/', 1)
         AND (c.client_id = auth.uid() OR c.professional_user_id = auth.uid())
    )
  );

CREATE POLICY "Chat participants can delete attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.conversations c
         WHERE c.id::text = split_part(name, '/', 1)
           AND (c.client_id = auth.uid() OR c.professional_user_id = auth.uid())
      )
    )
  );
