-- Revoke all default execution rights
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.promote_user_to_admin(text) FROM PUBLIC;

-- These functions are SECURITY DEFINER. 
-- handle_new_user is only intended to be called by the trigger (running as postgres/superuser).
-- promote_user_to_admin is a utility for the admin to use via SQL editor or controlled environment.

-- To allow authenticated users to potentially call them (if needed in the future, though not recommended for these specific ones):
-- GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated; 
-- But for now, we keep them restricted as the linter suggests.
