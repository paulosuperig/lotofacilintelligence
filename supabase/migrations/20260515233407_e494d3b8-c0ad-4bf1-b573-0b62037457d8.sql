-- 1. ESQUEMAS E PROTEÇÃO DE FUNÇÕES
CREATE SCHEMA IF NOT EXISTS app_private;

-- Remover permissões públicas por padrão em novos objetos
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Corrigir a localização da função handle_new_user se necessário
DO $$ 
BEGIN
    -- Se existir no public e NÃO existir no app_private, mover.
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user' AND pronamespace = 'public'::regnamespace) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user' AND pronamespace = 'app_private'::regnamespace) THEN
            -- Primeiro deletar o trigger que depende dela no public
            DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
            -- Agora mover
            ALTER FUNCTION public.handle_new_user() SET SCHEMA app_private;
        ELSE
            -- Se já existe no privado, apenas deletar o trigger no public para recriar
            DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
            -- E deletar a do public com cascade para garantir limpeza
            DROP FUNCTION public.handle_new_user() CASCADE;
        END IF;
    END IF;
END $$;

-- Recriar trigger apontando para o esquema privado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION app_private.handle_new_user();

-- 2. INTEGRIDADE E VALIDAÇÃO DE DADOS (profiles)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'profiles_email_check') THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
END $$;

CREATE OR REPLACE FUNCTION app_private.sanitize_profile_data()
RETURNS TRIGGER AS $$
BEGIN
    NEW.full_name = NULLIF(trim(NEW.full_name), '');
    NEW.whatsapp = NULLIF(regexp_replace(NEW.whatsapp, '\D', '', 'g'), '');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sanitize_profile ON public.profiles;
CREATE TRIGGER tr_sanitize_profile
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION app_private.sanitize_profile_data();

-- 3. AUDITORIA ADMINISTRATIVA
CREATE TABLE IF NOT EXISTS app_private.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    target_id UUID,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. OTIMIZAÇÃO DE BUSCAS (games_history)
CREATE INDEX IF NOT EXISTS idx_games_history_numbers_gin ON public.games_history USING GIN (numbers);

-- 5. REFORÇO DE RLS (system_configs)
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to configs" ON public.system_configs;
CREATE POLICY "Admins full access to configs"
ON public.system_configs
FOR ALL
TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can read public configs" ON public.system_configs;
CREATE POLICY "Users can read public configs"
ON public.system_configs
FOR SELECT
TO authenticated
USING (key != 'deepseek_api_key');

-- 6. GARANTIA DE ADMIN PERMANENTE (Proteção contra Lockout)
CREATE OR REPLACE FUNCTION app_private.prevent_last_admin_lockout()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.role = 'admin' AND NEW.role != 'admin') OR (OLD.status = 'active' AND NEW.status != 'active' AND OLD.role = 'admin') THEN
        IF (SELECT count(*) FROM public.profiles WHERE role = 'admin' AND status = 'active') <= 1 THEN
            RAISE EXCEPTION 'Não é possível desativar o único administrador ativo do sistema.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_admin_lockout ON public.profiles;
CREATE TRIGGER tr_prevent_admin_lockout
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION app_private.prevent_last_admin_lockout();
