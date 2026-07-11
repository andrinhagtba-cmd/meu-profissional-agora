
-- 1) Trigger: quando uma review é aprovada, notifica o profissional
CREATE OR REPLACE FUNCTION public.tg_notify_pro_on_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pro_user uuid; v_pro_name text;
BEGIN
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT user_id, COALESCE(professional_name, business_name, 'Profissional')
      INTO v_pro_user, v_pro_name
      FROM public.professional_profiles WHERE id = NEW.professional_id;
    IF v_pro_user IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (v_pro_user, 'Nova avaliação recebida',
        'Você recebeu uma avaliação ' || NEW.rating || '★',
        'review_new', '/painel');
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_review_notify_pro ON public.reviews;
CREATE TRIGGER on_review_notify_pro
AFTER INSERT OR UPDATE OF status ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_pro_on_review();

-- 2) Recalcular avg_rating / reviews_count no professional_profiles
CREATE OR REPLACE FUNCTION public.recalc_pro_rating(_pro_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.professional_profiles pp
     SET average_rating = COALESCE((
           SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews
           WHERE professional_id = _pro_id AND status = 'approved'
         ), 0),
         reviews_count = COALESCE((
           SELECT COUNT(*) FROM public.reviews
           WHERE professional_id = _pro_id AND status = 'approved'
         ), 0)
   WHERE pp.id = _pro_id;
$$;

CREATE OR REPLACE FUNCTION public.tg_recalc_pro_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_pro_rating(OLD.professional_id); RETURN OLD;
  ELSE
    PERFORM public.recalc_pro_rating(NEW.professional_id);
    IF TG_OP = 'UPDATE' AND OLD.professional_id <> NEW.professional_id THEN
      PERFORM public.recalc_pro_rating(OLD.professional_id);
    END IF;
    RETURN NEW;
  END IF;
END $$;

DROP TRIGGER IF EXISTS on_review_recalc ON public.reviews;
CREATE TRIGGER on_review_recalc
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.tg_recalc_pro_rating();

-- 3) RPC para o cliente criar review de um pedido aceito
CREATE OR REPLACE FUNCTION public.submit_review(
  _quote_id uuid, _rating int, _comment text, _title text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_client uuid; v_pro uuid; v_id uuid;
BEGIN
  IF _rating < 1 OR _rating > 5 THEN RAISE EXCEPTION 'Invalid rating'; END IF;
  SELECT client_id, selected_professional_id INTO v_client, v_pro
    FROM public.quote_requests WHERE id = _quote_id;
  IF v_client IS NULL OR v_client <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_pro IS NULL THEN RAISE EXCEPTION 'No selected professional for this quote'; END IF;

  INSERT INTO public.reviews (professional_id, client_id, quote_request_id, rating, title, comment, status)
  VALUES (v_pro, v_client, _quote_id, _rating, _title, _comment, 'approved')
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.submit_review(uuid,int,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_review(uuid,int,text,text) TO authenticated, service_role;

-- 4) Políticas RLS admin extras para painel administrativo
-- Admin pode ver tudo em várias tabelas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='admin_select_all_profiles') THEN
    CREATE POLICY admin_select_all_profiles ON public.profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='professional_profiles' AND policyname='admin_all_pro_profiles') THEN
    CREATE POLICY admin_all_pro_profiles ON public.professional_profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quote_requests' AND policyname='admin_select_all_quotes') THEN
    CREATE POLICY admin_select_all_quotes ON public.quote_requests FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='admin_all_reviews') THEN
    CREATE POLICY admin_all_reviews ON public.reviews FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reports' AND policyname='admin_all_reports') THEN
    CREATE POLICY admin_all_reports ON public.reports FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;
