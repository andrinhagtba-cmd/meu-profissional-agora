ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS address_complement text,
  ADD COLUMN IF NOT EXISTS address_reference text;

ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS holiday_note text;

CREATE TABLE IF NOT EXISTS public.professional_business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  is_closed boolean NOT NULL DEFAULT false,
  is_24h boolean NOT NULL DEFAULT false,
  open_time time,
  close_time time,
  break_start time,
  break_end time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, weekday)
);

CREATE INDEX IF NOT EXISTS idx_pbh_professional ON public.professional_business_hours(professional_id);

GRANT SELECT ON public.professional_business_hours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_business_hours TO authenticated;
GRANT ALL ON public.professional_business_hours TO service_role;

ALTER TABLE public.professional_business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published_hours" ON public.professional_business_hours
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = professional_business_hours.professional_id
        AND pp.profile_status = 'published'
    )
  );

CREATE POLICY "owner_manage_hours" ON public.professional_business_hours
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = professional_business_hours.professional_id
        AND pp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = professional_business_hours.professional_id
        AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "admin_manage_hours" ON public.professional_business_hours
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER set_pbh_updated_at
  BEFORE UPDATE ON public.professional_business_hours
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();