-- 1. Fortalecimento da Segurança de Funções
-- Revogar execução pública de funções críticas
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() TO service_role;

-- 2. Auditoria e Garantia de RLS em games_history
ALTER TABLE public.games_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can delete their own history" ON public.games_history;
CREATE POLICY "Users can delete their own history" 
ON public.games_history 
FOR DELETE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own history" ON public.games_history;
CREATE POLICY "Users can view their own history" 
ON public.games_history 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own history" ON public.games_history;
CREATE POLICY "Users can insert their own history" 
ON public.games_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Segurança de Configurações de Sistema (API Keys, etc)
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage system configs" ON public.system_configs;
CREATE POLICY "Admins can manage system configs" 
ON public.system_configs 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Proteção contra vazamento de metadados em profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 5. Função de limpeza atômica
CREATE OR REPLACE FUNCTION public.clear_user_history()
RETURNS void AS $$
BEGIN
  DELETE FROM public.games_history WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.clear_user_history() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.clear_user_history() TO authenticated;
