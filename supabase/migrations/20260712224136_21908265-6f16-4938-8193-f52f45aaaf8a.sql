
ALTER TABLE public.professional_profiles ALTER COLUMN average_rating SET DEFAULT 5;

UPDATE public.professional_profiles
   SET average_rating = 5
 WHERE COALESCE(reviews_count, 0) = 0;

CREATE OR REPLACE FUNCTION public.recalc_pro_rating(_pro_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.professional_profiles pp
     SET reviews_count = COALESCE((
           SELECT COUNT(*) FROM public.reviews
           WHERE professional_id = _pro_id AND status = 'approved'
         ), 0),
         average_rating = COALESCE((
           SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews
           WHERE professional_id = _pro_id AND status = 'approved'
         ), 5)
   WHERE pp.id = _pro_id;
$function$;
