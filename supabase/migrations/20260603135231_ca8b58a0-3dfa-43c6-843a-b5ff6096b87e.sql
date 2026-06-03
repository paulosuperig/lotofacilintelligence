-- has_role is invoked from RLS policies; PostgREST executes as 'authenticated' (and 'anon').
-- Re-grant EXECUTE so policies can evaluate. The function is SECURITY DEFINER and only
-- reads from user_roles, so exposing it is safe.

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

-- clear_user_history remains restricted to authenticated callers
GRANT EXECUTE ON FUNCTION public.clear_user_history() TO authenticated, service_role;