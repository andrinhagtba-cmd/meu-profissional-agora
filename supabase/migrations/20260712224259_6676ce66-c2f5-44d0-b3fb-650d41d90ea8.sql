
SET session_replication_role = 'replica';
UPDATE public.professional_profiles
   SET average_rating = 5
 WHERE COALESCE(reviews_count, 0) = 0;
SET session_replication_role = 'origin';
