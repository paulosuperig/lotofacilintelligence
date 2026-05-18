-- Enable RLS on the heartbeat table
ALTER TABLE public.heartbeat ENABLE ROW LEVEL SECURITY;

-- We don't need any policies as this table is only for internal system use by the cron job
-- By enabling RLS without policies, only the postgres role (system) can access it.