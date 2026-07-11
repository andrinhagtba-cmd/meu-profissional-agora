GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO service_role;

GRANT SELECT ON public.plans TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO service_role;

GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO service_role;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;