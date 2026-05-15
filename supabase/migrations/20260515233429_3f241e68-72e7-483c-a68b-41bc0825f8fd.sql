-- 1. CORRIGIR SEARCH_PATH (Vulnerabilidades 1 e 2)
ALTER FUNCTION app_private.sanitize_profile_data() SET search_path = public, app_private;
ALTER FUNCTION app_private.prevent_last_admin_lockout() SET search_path = public, app_private;

-- 2. RESTRINGIR EXECUÇÃO DE FUNÇÕES SENSÍVEIS (Vulnerabilidades 3 e 4)
-- Revogar execução de qualquer função SECURITY DEFINER de usuários não autorizados
REVOKE EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO service_role;

-- Garantir que apenas o sistema (trigger) pode executar handle_new_user
REVOKE EXECUTE ON FUNCTION app_private.handle_new_user() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.handle_new_user() TO service_role;

-- 3. Otimização adicional: Adicionar timestamp de última atividade no perfil
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now();
