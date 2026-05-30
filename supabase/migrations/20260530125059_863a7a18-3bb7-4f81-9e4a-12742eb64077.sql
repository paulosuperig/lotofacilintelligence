-- 1. Fix search_path for SECURITY DEFINER functions (Mitigates 0011_function_search_path_mutable)
ALTER FUNCTION public.prevent_profile_privilege_escalation() SET search_path = public;
ALTER FUNCTION public.clear_user_history() SET search_path = public;

-- 2. Restringir execução de funções administrativas (Mitigates 0029_authenticated_security_definer_function_executable)
-- A função clear_user_history é segura para authenticated, mas prevent_profile_privilege_escalation deve ser apenas para triggers (service_role)
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM authenticated;

-- 3. Garantir RLS em tabelas auxiliares (Mitigates 0008_rls_enabled_no_policy)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.heartbeat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public heartbeat view" ON public.heartbeat;
CREATE POLICY "Public heartbeat view" ON public.heartbeat FOR SELECT USING (true);

ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their chat history" ON public.ai_chat_history;
CREATE POLICY "Users can manage their chat history" ON public.ai_chat_history FOR ALL USING (auth.uid() = user_id);
