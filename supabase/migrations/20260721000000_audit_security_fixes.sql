-- AUD-001/002: Restrictive active-account policies & has_role active JOIN profiles

-- 1. Helper function to check if a user is active
CREATE OR REPLACE FUNCTION app_private.is_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND status = 'active'
  )
$$;

-- 2. Update has_role to include active check (JOIN profiles)
CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND p.status = 'active'
  )
$$;

-- 3. Update public has_role wrapper
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT app_private.has_role(_user_id, _role);
$$;

-- 4. Apply restrictive policies to private tables (must be active)
-- We re-create the policies that only checked for auth.uid()

-- GAMES_HISTORY
DROP POLICY IF EXISTS "games_history_user_all_policy" ON public.games_history;
CREATE POLICY "games_history_user_all_policy" ON public.games_history
FOR ALL TO authenticated
USING (user_id = auth.uid() AND app_private.is_active(auth.uid()))
WITH CHECK (user_id = auth.uid() AND app_private.is_active(auth.uid()));

-- AI_CHAT_HISTORY
DROP POLICY IF EXISTS "ai_chat_history_user_all_policy" ON public.ai_chat_history;
CREATE POLICY "ai_chat_history_user_all_policy" ON public.ai_chat_history
FOR ALL TO authenticated
USING (user_id = auth.uid() AND app_private.is_active(auth.uid()))
WITH CHECK (user_id = auth.uid() AND app_private.is_active(auth.uid()));

-- PROFILES (Update self check)
-- Users can still see their own profile even if blocked (to see the status), 
-- but they shouldn't be able to update anything if they are blocked.
DROP POLICY IF EXISTS "profiles_update_self_policy" ON public.profiles;
CREATE POLICY "profiles_update_self_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() AND app_private.is_active(auth.uid()))
WITH CHECK (
    id = auth.uid() AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
    status = (SELECT status FROM public.profiles WHERE id = auth.uid())
);

-- AUD-004: RPC clear guard
CREATE OR REPLACE FUNCTION public.clear_user_history()
RETURNS void AS $$
BEGIN
  IF NOT app_private.is_active(auth.uid()) THEN
    RAISE EXCEPTION 'Account is not active';
  END IF;
  DELETE FROM public.games_history WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

