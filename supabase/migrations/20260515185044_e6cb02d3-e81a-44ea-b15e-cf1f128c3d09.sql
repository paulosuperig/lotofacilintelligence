CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
REVOKE ALL ON SCHEMA app_private FROM anon;
REVOKE ALL ON SCHEMA app_private FROM authenticated;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) FROM authenticated;

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage configs" ON public.system_configs;
CREATE POLICY "Admins can manage configs"
ON public.system_configs
FOR ALL
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;