-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Triggers for Auth -> Public mapping
-- Note: The handle_new_user function already exists but lacks a trigger.
-- Let's ensure it's robust and correctly handles profiles + roles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (new.id, new.email, 'demo', 'active')
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'demo')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Drop trigger if exists to avoid errors on retry
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Re-create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Refine games_history RLS
-- Existing policy: "Users can manage own games" (ALL)
-- We'll make it explicit for better visibility in logs
DROP POLICY IF EXISTS "Users can manage own games" ON public.games_history;

CREATE POLICY "Users can select own games"
ON public.games_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own games"
ON public.games_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own games"
ON public.games_history FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. Utility function to promote admin (run manually via SQL Editor if needed)
-- This is just for reference, the agent will call UPDATE later
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_email text)
RETURNS void AS $$
DECLARE
  target_id uuid;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = target_email;
  IF target_id IS NOT NULL THEN
    UPDATE public.profiles SET role = 'admin' WHERE id = target_id;
    UPDATE public.user_roles SET role = 'admin' WHERE user_id = target_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
