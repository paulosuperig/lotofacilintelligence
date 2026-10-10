CREATE OR REPLACE FUNCTION app_private.is_active_account()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'active'::public.account_status);
$$;
REVOKE ALL ON FUNCTION app_private.is_active_account() FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app_private.is_active_account() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id WHERE r.user_id = _user_id AND r.role = _role AND p.status = 'active'::public.account_status);
$$;

CREATE POLICY active_account_required ON public.games_history AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT app_private.is_active_account())) WITH CHECK ((SELECT app_private.is_active_account()));
CREATE POLICY active_account_required ON public.ai_chat_history AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT app_private.is_active_account())) WITH CHECK ((SELECT app_private.is_active_account()));
CREATE POLICY active_account_required ON public.user_roles AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT app_private.is_active_account())) WITH CHECK ((SELECT app_private.is_active_account()));
CREATE POLICY active_account_required ON public.system_configs AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT app_private.is_active_account())) WITH CHECK ((SELECT app_private.is_active_account()));
CREATE POLICY active_account_profile_read ON public.profiles AS RESTRICTIVE FOR SELECT TO authenticated USING (id = (SELECT auth.uid()) OR (SELECT app_private.is_active_account()));
CREATE POLICY active_account_profile_insert ON public.profiles AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK ((SELECT app_private.is_active_account()));
CREATE POLICY active_account_profile_update ON public.profiles AS RESTRICTIVE FOR UPDATE TO authenticated USING ((SELECT app_private.is_active_account())) WITH CHECK ((SELECT app_private.is_active_account()));
CREATE POLICY active_account_profile_delete ON public.profiles AS RESTRICTIVE FOR DELETE TO authenticated USING ((SELECT app_private.is_active_account()));

CREATE OR REPLACE FUNCTION public.clear_user_history()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NOT app_private.is_active_account() THEN RAISE EXCEPTION 'Acesso bloqueado ou conta inexistente.' USING ERRCODE = '42501'; END IF;
 DELETE FROM public.games_history WHERE user_id = auth.uid();
END;
$$;
REVOKE ALL ON FUNCTION public.clear_user_history() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_user_history() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app_private.prevent_last_admin_lockout()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE removes_active_admin boolean := false;
BEGIN
 IF OLD.role = 'admin'::public.app_role AND OLD.status = 'active'::public.account_status THEN
   IF TG_OP = 'DELETE' THEN
     removes_active_admin := true;
   ELSIF TG_OP = 'UPDATE' THEN
     removes_active_admin := NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status;
   END IF;
 END IF;
 IF removes_active_admin THEN
   IF NOT pg_try_advisory_xact_lock(54284639, 1002) THEN
     RAISE EXCEPTION 'Outra alteração de administrador está em andamento. Tente novamente.' USING ERRCODE = '40001';
   END IF;
   IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id <> OLD.id AND role = 'admin'::public.app_role AND status = 'active'::public.account_status) THEN
     RAISE EXCEPTION 'Não é possível remover, bloquear ou rebaixar o único administrador ativo do sistema.' USING ERRCODE = '23514';
   END IF;
 END IF;
 IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION app_private.prevent_last_admin_lockout() FROM PUBLIC, anon, authenticated;
