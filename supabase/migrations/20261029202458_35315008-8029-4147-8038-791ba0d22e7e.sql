DROP POLICY IF EXISTS "heartbeat_public_select_policy" ON public.heartbeat;
DROP POLICY IF EXISTS "Public heartbeat view" ON public.heartbeat;
REVOKE ALL ON public.heartbeat FROM anon, authenticated;
GRANT ALL ON public.heartbeat TO service_role;
CREATE POLICY "Admins can view heartbeat" ON public.heartbeat FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.heartbeat TO authenticated;