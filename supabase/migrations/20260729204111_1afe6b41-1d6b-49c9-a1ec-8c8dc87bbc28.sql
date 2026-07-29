CREATE TABLE public.showcase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  category_slug text,
  description text NOT NULL,
  city text NOT NULL DEFAULT 'Plano Piloto',
  state text NOT NULL DEFAULT 'DF',
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  urgency text NOT NULL DEFAULT 'esta-semana',
  proposals_count integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.showcase_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.showcase_requests TO authenticated;
GRANT ALL ON public.showcase_requests TO service_role;

ALTER TABLE public.showcase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published showcase requests"
  ON public.showcase_requests FOR SELECT
  USING (is_published = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage showcase requests"
  ON public.showcase_requests FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_showcase_requests_updated_at
  BEFORE UPDATE ON public.showcase_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.showcase_requests (category, category_slug, description, city, state, request_date, urgency, proposals_count, display_order) VALUES
('Eletricista','eletricista','Preciso instalar um chuveiro novo (220v) e trocar uma tomada que está esquentando. Apartamento na Asa Sul.','Plano Piloto','DF',CURRENT_DATE,'hoje',4,1),
('Pintor','pintor','Pintura completa de apartamento de 65m², 2 quartos, sala e cozinha. Paredes em bom estado, cor branca.','Águas Claras','DF',CURRENT_DATE - 1,'esta-semana',7,2),
('Técnico de ar-condicionado','ar-condicionado','Manutenção e higienização de 2 aparelhos split de 12.000 BTUs. Um deles está pingando água.','Taguatinga','DF',CURRENT_DATE - 1,'esta-semana',5,3),
('Montador de móveis','montador','Montagem de guarda-roupa 6 portas e duas mesas de cabeceira compradas em loja online.','Guará','DF',CURRENT_DATE - 2,'sem-urgencia',3,4),
('Encanador','encanador','Vazamento embaixo da pia da cozinha, precisa de reparo urgente. Água acumulando no armário.','Ceilândia','DF',CURRENT_DATE - 2,'hoje',6,5),
('Diarista','diarista','Limpeza residencial completa em casa de 3 quartos antes de receber visitas no fim de semana.','Sobradinho','DF',CURRENT_DATE - 3,'esta-semana',8,6);