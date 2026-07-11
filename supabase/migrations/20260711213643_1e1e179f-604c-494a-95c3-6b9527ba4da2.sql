
CREATE POLICY "admins manage user_roles insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "admins manage user_roles update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "admins manage user_roles delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
