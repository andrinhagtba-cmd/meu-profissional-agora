ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'proposal_accepted';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'proposal_rejected';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'quote_status';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'message';