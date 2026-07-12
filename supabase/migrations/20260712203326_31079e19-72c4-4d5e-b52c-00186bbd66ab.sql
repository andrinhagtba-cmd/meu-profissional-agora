REVOKE ALL ON FUNCTION public.sync_public_branding() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_public_branding() FROM anon;
REVOKE ALL ON FUNCTION public.sync_public_branding() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sync_public_branding() TO service_role;