
-- 1. system_configs: restrict SELECT to admins
DROP POLICY IF EXISTS "System Configs - Select" ON public.system_configs;
CREATE POLICY "System Configs - Select"
ON public.system_configs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. user_roles: only admins can insert roles (prevent self-escalation)
DROP POLICY IF EXISTS "User Roles - Insert" ON public.user_roles;
CREATE POLICY "User Roles - Insert"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Revoke EXECUTE on trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_profile_role_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 4. Realtime messages: restrict to user's own topic (topic == auth.uid())
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own realtime topic" ON realtime.messages;
CREATE POLICY "Users can read their own realtime topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid())::text = realtime.topic()
);

DROP POLICY IF EXISTS "Users can write to their own realtime topic" ON realtime.messages;
CREATE POLICY "Users can write to their own realtime topic"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid())::text = realtime.topic()
);
