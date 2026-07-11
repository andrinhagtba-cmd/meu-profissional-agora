
CREATE OR REPLACE FUNCTION public.submit_review(
  _quote_id uuid, _rating int, _comment text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_client uuid; v_pro uuid; v_id uuid;
BEGIN
  IF _rating < 1 OR _rating > 5 THEN RAISE EXCEPTION 'Invalid rating'; END IF;
  SELECT client_id, selected_professional_id INTO v_client, v_pro
    FROM public.quote_requests WHERE id = _quote_id;
  IF v_client IS NULL OR v_client <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_pro IS NULL THEN RAISE EXCEPTION 'No selected professional for this quote'; END IF;

  INSERT INTO public.reviews (professional_id, client_id, quote_request_id, rating, comment, status)
  VALUES (v_pro, v_client, _quote_id, _rating, _comment, 'approved')
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

DROP FUNCTION IF EXISTS public.submit_review(uuid,int,text,text);
REVOKE ALL ON FUNCTION public.submit_review(uuid,int,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_review(uuid,int,text) TO authenticated, service_role;
