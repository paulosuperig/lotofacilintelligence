REVOKE ALL ON FUNCTION app_private.promote_user_to_admin(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app_private.sanitize_profile_data() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app_private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated, service_role;
