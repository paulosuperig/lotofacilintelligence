-- Drop existing policies if they exist to start fresh
DROP POLICY IF EXISTS "Users can view their own games" ON public.games_history;
DROP POLICY IF EXISTS "Users can insert their own games" ON public.games_history;
DROP POLICY IF EXISTS "Users can delete their own games" ON public.games_history;

-- Ensure RLS is enabled
ALTER TABLE public.games_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own games
CREATE POLICY "Users can view their own games" 
ON public.games_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own games
CREATE POLICY "Users can insert their own games" 
ON public.games_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own games
CREATE POLICY "Users can delete their own games" 
ON public.games_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Grant appropriate permissions
GRANT SELECT, INSERT, DELETE ON public.games_history TO authenticated;
GRANT ALL ON public.games_history TO service_role;