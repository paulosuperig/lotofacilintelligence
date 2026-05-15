-- Fix Search Path and Permissions for has_role
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Fix Search Path and Permissions for handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
-- No GRANT needed as it's a trigger function executed by superuser

-- Additional RLS for user_roles (Self-read only, Admin all)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Ensure system_configs updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_configs_updated_at
    BEFORE UPDATE ON public.system_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure profiles updated_at trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();