-- 1. Fix handle_profile_role_sync search_path
CREATE OR REPLACE FUNCTION public.handle_profile_role_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, NEW.role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF (TG_OP = 'UPDATE' AND OLD.role <> NEW.role) THEN
    UPDATE public.user_roles SET role = NEW.role WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Consolidate policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles - Select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles - Insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles - Update" ON public.profiles;
DROP POLICY IF EXISTS "Profiles - Delete" ON public.profiles;

CREATE POLICY "Profiles - Select" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Profiles - Insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles - Update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Profiles - Delete" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Consolidate policies for user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "User Roles - Select" ON public.user_roles;
DROP POLICY IF EXISTS "User Roles - Insert" ON public.user_roles;
DROP POLICY IF EXISTS "User Roles - Update" ON public.user_roles;
DROP POLICY IF EXISTS "User Roles - Delete" ON public.user_roles;

CREATE POLICY "User Roles - Select" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "User Roles - Insert" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "User Roles - Update" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "User Roles - Delete" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Consolidate policies for system_configs
DROP POLICY IF EXISTS "Anyone can read system_configs" ON public.system_configs;
DROP POLICY IF EXISTS "Admins can manage system_configs" ON public.system_configs;
DROP POLICY IF EXISTS "Authenticated users can read configs" ON public.system_configs;
DROP POLICY IF EXISTS "Admins can manage configs" ON public.system_configs;
DROP POLICY IF EXISTS "System Configs - Select" ON public.system_configs;
DROP POLICY IF EXISTS "System Configs - All" ON public.system_configs;

CREATE POLICY "System Configs - Select" ON public.system_configs FOR SELECT USING (true);
CREATE POLICY "System Configs - All" ON public.system_configs FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Revoke public EXECUTE on all SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_profile_role_sync() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
