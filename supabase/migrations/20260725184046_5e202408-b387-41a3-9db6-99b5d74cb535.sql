ALTER TABLE public.quote_requests
  DROP CONSTRAINT IF EXISTS quote_requests_selected_professional_id_fkey;

ALTER TABLE public.quote_requests
  ADD CONSTRAINT quote_requests_selected_professional_id_fkey
  FOREIGN KEY (selected_professional_id)
  REFERENCES public.professional_profiles(id)
  ON DELETE SET NULL;