
-- ============ storage.objects policies ============

-- public-media: leitura pública, escrita apenas admin
CREATE POLICY "public-media read all"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'public-media');

CREATE POLICY "public-media admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'public-media' AND public.is_admin(auth.uid()));

CREATE POLICY "public-media admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'public-media' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'public-media' AND public.is_admin(auth.uid()));

CREATE POLICY "public-media admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'public-media' AND public.is_admin(auth.uid()));

-- professional-media: leitura pública, escrita restrita à própria pasta
CREATE POLICY "professional-media read all"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'professional-media');

CREATE POLICY "professional-media owner insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'professional-media'
    AND (
      public.is_admin(auth.uid())
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY "professional-media owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'professional-media'
    AND (
      public.is_admin(auth.uid())
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  )
  WITH CHECK (
    bucket_id = 'professional-media'
    AND (
      public.is_admin(auth.uid())
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY "professional-media owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'professional-media'
    AND (
      public.is_admin(auth.uid())
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- private-documents: leitura e escrita apenas do dono ou admin
CREATE POLICY "private-documents owner select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'private-documents'
    AND (
      public.is_admin(auth.uid())
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY "private-documents owner insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'private-documents'
    AND (
      public.is_admin(auth.uid())
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY "private-documents owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'private-documents'
    AND (
      public.is_admin(auth.uid())
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  )
  WITH CHECK (
    bucket_id = 'private-documents'
    AND (
      public.is_admin(auth.uid())
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY "private-documents owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'private-documents'
    AND (
      public.is_admin(auth.uid())
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );
