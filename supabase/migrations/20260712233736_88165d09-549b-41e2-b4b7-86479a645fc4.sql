
-- Evolve portfolio_items into multimedia portfolio (images + Instagram + YouTube)
ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS embed_url text,
  ADD COLUMN IF NOT EXISTS external_media_id text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS alt_text text,
  ADD COLUMN IF NOT EXISTS is_cover boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS moderation_notes text,
  ADD COLUMN IF NOT EXISTS moderated_by uuid,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Allow image_url to be NULL for external videos (they use external_url/embed_url)
ALTER TABLE public.portfolio_items ALTER COLUMN image_url DROP NOT NULL;

-- Constraints (drop first to make idempotent)
ALTER TABLE public.portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_media_type_check;
ALTER TABLE public.portfolio_items
  ADD CONSTRAINT portfolio_items_media_type_check
  CHECK (media_type IN ('image','instagram_reel','youtube_video','youtube_short'));

ALTER TABLE public.portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_moderation_status_check;
ALTER TABLE public.portfolio_items
  ADD CONSTRAINT portfolio_items_moderation_status_check
  CHECK (moderation_status IN ('pending','approved','rejected'));

ALTER TABLE public.portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_media_payload_check;
ALTER TABLE public.portfolio_items
  ADD CONSTRAINT portfolio_items_media_payload_check
  CHECK (
    (media_type = 'image' AND image_url IS NOT NULL)
    OR (media_type <> 'image' AND external_url IS NOT NULL AND embed_url IS NOT NULL)
  );

-- Backfill: existing rows are approved images
UPDATE public.portfolio_items
   SET media_type = 'image', moderation_status = 'approved'
 WHERE media_type IS NULL OR moderation_status IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS portfolio_items_pro_sort_idx
  ON public.portfolio_items (professional_id, sort_order);
CREATE INDEX IF NOT EXISTS portfolio_items_pro_public_idx
  ON public.portfolio_items (professional_id)
  WHERE status = 'active' AND moderation_status = 'approved';

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_portfolio_items_updated_at ON public.portfolio_items;
CREATE TRIGGER trg_portfolio_items_updated_at
  BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-set moderation_status to 'pending' on new items from non-admins
CREATE OR REPLACE FUNCTION public.tg_portfolio_items_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF public.is_admin(auth.uid()) THEN
      NEW.moderation_status := COALESCE(NEW.moderation_status, 'approved');
      NEW.moderated_by := auth.uid();
      NEW.moderated_at := now();
    ELSE
      NEW.moderation_status := 'pending';
      NEW.moderated_by := NULL;
      NEW.moderated_at := NULL;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Non-admins cannot change moderation fields
    IF NOT public.is_admin(auth.uid()) THEN
      NEW.moderation_status := OLD.moderation_status;
      NEW.moderation_notes := OLD.moderation_notes;
      NEW.moderated_by := OLD.moderated_by;
      NEW.moderated_at := OLD.moderated_at;
    ELSIF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
      NEW.moderated_by := auth.uid();
      NEW.moderated_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_portfolio_items_moderation ON public.portfolio_items;
CREATE TRIGGER trg_portfolio_items_moderation
  BEFORE INSERT OR UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_portfolio_items_moderation();

-- Refresh RLS policies for public read: only active + approved
DROP POLICY IF EXISTS "Public can view active portfolio items" ON public.portfolio_items;
DROP POLICY IF EXISTS "Anyone can view active portfolio items" ON public.portfolio_items;
DROP POLICY IF EXISTS "Public read approved portfolio items" ON public.portfolio_items;
CREATE POLICY "Public read approved portfolio items"
  ON public.portfolio_items FOR SELECT
  USING (status = 'active' AND moderation_status = 'approved');

-- Grants (safety net)
GRANT SELECT ON public.portfolio_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;
GRANT ALL ON public.portfolio_items TO service_role;

-- Reorder RPC (batch updates sort_order for owner or admin)
CREATE OR REPLACE FUNCTION public.reorder_portfolio_items(_professional_id uuid, _ordered_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_id uuid;
  i int := 0;
BEGIN
  SELECT user_id INTO v_owner FROM public.professional_profiles WHERE id = _professional_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Professional not found'; END IF;
  IF auth.uid() <> v_owner AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOREACH v_id IN ARRAY _ordered_ids LOOP
    UPDATE public.portfolio_items
       SET sort_order = i
     WHERE id = v_id AND professional_id = _professional_id;
    i := i + 1;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reorder_portfolio_items(uuid, uuid[]) TO authenticated;

-- Moderation RPC (admin only)
CREATE OR REPLACE FUNCTION public.moderate_portfolio_item(_id uuid, _status text, _notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _status NOT IN ('pending','approved','rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  UPDATE public.portfolio_items
     SET moderation_status = _status,
         moderation_notes = _notes,
         moderated_by = auth.uid(),
         moderated_at = now()
   WHERE id = _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.moderate_portfolio_item(uuid, text, text) TO authenticated;
