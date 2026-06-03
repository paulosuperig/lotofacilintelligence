
-- 1. Limpeza de Políticas Redundantes/Antigas
-- Vamos remover todas as políticas atuais para garantir que não haja sobreposições permissivas.
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. Garantir que o schema app_private exista e esteja protegido
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
REVOKE ALL ON SCHEMA app_private FROM anon;
REVOKE ALL ON SCHEMA app_private FROM authenticated;

-- 3. Função has_role robusta no schema privado
CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Função helper pública (opcional, para uso no frontend via RPC)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT app_private.has_role(_user_id, _role);
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 5. Novas Políticas Consolidadas e Seguras

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR app_private.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_self_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (
    id = auth.uid() AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
    status = (SELECT status FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "profiles_admin_all_policy" ON public.profiles
FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'));

-- USER_ROLES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_policy" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR app_private.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_admin_all_policy" ON public.user_roles
FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'));

-- GAMES_HISTORY
ALTER TABLE public.games_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "games_history_user_all_policy" ON public.games_history
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "games_history_admin_select_policy" ON public.games_history
FOR SELECT TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'));

-- AI_CHAT_HISTORY
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_chat_history_user_all_policy" ON public.ai_chat_history
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- SYSTEM_CONFIGS
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_configs_admin_all_policy" ON public.system_configs
FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'));

-- HEARTBEAT
ALTER TABLE public.heartbeat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "heartbeat_public_select_policy" ON public.heartbeat
FOR SELECT TO public
USING (true);

-- 6. Otimização de Triggers e Sincronização

-- Melhorar handle_new_user para ser idempotente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (new.id, new.email, 'demo', 'active')
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'demo')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Garantir que o trigger de sincronização role -> user_roles esteja correto
CREATE OR REPLACE FUNCTION public.handle_profile_role_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, NEW.role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role) THEN
    -- Remove roles antigos e adiciona o novo para manter 1:1 sync se desejado, 
    -- ou apenas garante que o novo exista. Como o sistema usa enum e role única no profile:
    DELETE FROM public.user_roles WHERE user_id = NEW.id;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, NEW.role);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Re-aplicar Grants Essenciais
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.games_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_configs TO authenticated;
GRANT SELECT ON public.heartbeat TO authenticated, anon;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
