-- 1. Fix SECURITY DEFINER functions and search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (new.id, new.email, 'demo', 'active');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'demo');

  RETURN new;
END;
$$;

-- 2. Ensure system_configs RLS
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read system_configs" ON public.system_configs;
CREATE POLICY "Anyone can read system_configs"
ON public.system_configs
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage system_configs" ON public.system_configs;
CREATE POLICY "Admins can manage system_configs"
ON public.system_configs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- 3. Ensure ai_chat_history RLS
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own chat history" ON public.ai_chat_history;
CREATE POLICY "Users can view their own chat history"
ON public.ai_chat_history
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own chat history" ON public.ai_chat_history;
CREATE POLICY "Users can insert their own chat history"
ON public.ai_chat_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own chat history" ON public.ai_chat_history;
CREATE POLICY "Users can delete their own chat history"
ON public.ai_chat_history
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Ensure games_history RLS (if not already set)
ALTER TABLE public.games_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own games history" ON public.games_history;
CREATE POLICY "Users can view their own games history"
ON public.games_history
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own games history" ON public.games_history;
CREATE POLICY "Users can insert their own games history"
ON public.games_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own games history" ON public.games_history;
CREATE POLICY "Users can update their own games history"
ON public.games_history
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own games history" ON public.games_history;
CREATE POLICY "Users can delete their own games history"
ON public.games_history
FOR DELETE
USING (auth.uid() = user_id);

-- 5. Revoke EXECUTE from PUBLIC on handle_new_user
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON public.ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_games_history_user_id ON public.games_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- 7. Ensure cascading deletes for user data
-- First, drop existing constraints if they don't have CASCADE
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_roles_user_id_fkey') THEN
        ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_id_fkey') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;
END $$;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure games_history and ai_chat_history also cascade
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'games_history_user_id_fkey') THEN
        ALTER TABLE public.games_history DROP CONSTRAINT games_history_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'ai_chat_history_user_id_fkey') THEN
        ALTER TABLE public.ai_chat_history DROP CONSTRAINT ai_chat_history_user_id_fkey;
    END IF;
END $$;

ALTER TABLE public.games_history
ADD CONSTRAINT games_history_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.ai_chat_history
ADD CONSTRAINT ai_chat_history_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
