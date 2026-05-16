-- 1. Ensure schema exists
CREATE SCHEMA IF NOT EXISTS app_private;

-- 2. Create or Update the has_role function (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'app_private'
AS $function$
  -- Direct query on the table, bypassing RLS because of SECURITY DEFINER + postgres ownership
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- 3. Grant proper permissions
GRANT USAGE ON SCHEMA app_private TO authenticated, anon;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated, anon;

-- 4. Audit and Fix PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Basic policy: Everyone can see their OWN profile (No recursion here)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Admin policy: Admins can see EVERYTHING (Uses has_role which is SECURITY DEFINER)
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'));

-- Bootstrapping: Allow authenticated users to create their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Self-management: Allow users to update their own basic info (not role)
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Audit and Fix USER_ROLES RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;

-- Basic policy: Everyone can see their OWN roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin policy: Admins can manage EVERYTHING
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'));

-- Allow users to insert their own initial role (default to demo if handled by logic)
-- Actually, let's allow insert if user_id matches
CREATE POLICY "Users can insert own roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6. Trigger to automatically keep profiles and user_roles in sync
CREATE OR REPLACE FUNCTION public.handle_profile_role_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- When a profile is created or updated, ensure the role exists in user_roles
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, NEW.role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF (TG_OP = 'UPDATE' AND OLD.role <> NEW.role) THEN
    -- If role changed, we might want to update or insert
    -- For safety, we just insert the new role. In this app role is 1:1 usually.
    UPDATE public.user_roles SET role = NEW.role WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_change_sync_role ON public.profiles;
CREATE TRIGGER on_profile_change_sync_role
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_role_sync();

-- 7. Ensure system_configs is accessible
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage configs" ON public.system_configs;
CREATE POLICY "Admins can manage configs"
ON public.system_configs
FOR ALL
TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'));

-- Allow authenticated users to READ configs (needed for the app to function)
DROP POLICY IF EXISTS "Authenticated users can read configs" ON public.system_configs;
CREATE POLICY "Authenticated users can read configs"
ON public.system_configs
FOR SELECT
TO authenticated
USING (true);
