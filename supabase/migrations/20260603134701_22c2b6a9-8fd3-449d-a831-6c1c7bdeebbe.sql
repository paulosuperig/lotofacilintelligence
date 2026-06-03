REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_profile_role_sync() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.clear_user_history() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_user_history() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC;