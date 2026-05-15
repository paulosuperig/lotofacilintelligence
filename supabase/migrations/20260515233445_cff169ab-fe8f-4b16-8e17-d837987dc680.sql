-- Bloqueio total de execução pública para funções SECURITY DEFINER remanescentes
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION app_private.has_role(uuid, public.app_role) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION app_private.handle_new_user() FROM public, anon, authenticated;

-- Garantir que o service_role e o próprio postgres podem executar
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION app_private.handle_new_user() TO service_role;

-- Configurar search_path para a função public.has_role também
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
