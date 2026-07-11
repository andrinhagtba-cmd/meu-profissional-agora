-- Permitir que administradores leiam qualquer perfil (necessário para o painel admin exibir e-mail/nome dos usuários vinculados).
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));