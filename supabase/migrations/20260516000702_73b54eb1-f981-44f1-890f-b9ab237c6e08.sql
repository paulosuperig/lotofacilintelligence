-- 1. Create schema for private functions if it doesn't exist
CREATE SCHEMA IF NOT EXISTS app_private;

-- 2. Ensure has_role exists in the correct schema and is security definer
CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'app_private'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- 3. Grant usage and execution permissions
GRANT USAGE ON SCHEMA app_private TO authenticated, anon;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated, anon;

-- 4. Audit and Fix Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create robust policies
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

-- 5. Audit and Fix user_roles RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

-- 6. Audit and Fix system_configs RLS
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage configs" ON public.system_configs;
DROP POLICY IF EXISTS "Admins full access to configs" ON public.system_configs;

-- Allow admins full control
CREATE POLICY "Admins can manage configs"
ON public.system_configs
FOR ALL
TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow all authenticated users to read specific public configs if needed (optional, depends on use case)
-- For now, keep it restricted to admins as requested previously.
