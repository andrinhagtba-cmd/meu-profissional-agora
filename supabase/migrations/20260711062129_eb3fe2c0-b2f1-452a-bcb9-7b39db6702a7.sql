CREATE OR REPLACE FUNCTION public.list_public_quote_requests(_limit integer DEFAULT 60)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  city text,
  state text,
  urgency public.urgency_level,
  service_type public.service_type,
  status public.quote_status,
  created_at timestamptz,
  category_name text,
  category_slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.id,
    q.title,
    q.description,
    q.city,
    q.state,
    q.urgency,
    q.service_type,
    q.status,
    q.created_at,
    c.name AS category_name,
    c.slug AS category_slug
  FROM public.quote_requests q
  LEFT JOIN public.categories c ON c.id = q.category_id
  WHERE q.status IN ('open', 'receiving_proposals')
  ORDER BY q.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 60), 1), 100);
$$;

REVOKE ALL ON FUNCTION public.list_public_quote_requests(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_quote_requests(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.list_public_quote_requests(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_quote_requests(integer) TO service_role;