
-- 1) Remove profiles from realtime publication (prevents broadcast of sensitive PII)
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;

-- 2) Tighten system_configs: drop permissive read policy; only admins can read/write
DROP POLICY IF EXISTS "Users can read public configs" ON public.system_configs;
