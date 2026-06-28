
DROP POLICY IF EXISTS "Users can delete their own games" ON public.games_history;
DROP POLICY IF EXISTS "Users can insert their own games" ON public.games_history;
DROP POLICY IF EXISTS "Users can view their own games" ON public.games_history;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
