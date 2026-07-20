
-- 1) Backfill user_roles a partir de profiles.role='admin' ANTES de trocar policies
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM public.profiles WHERE role = 'admin'
ON CONFLICT DO NOTHING;

-- 2) profiles: SELECT somente próprio OU admin
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND cmd='SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "Profiles self or admin read"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- 3) system_configs: unificar admin via has_role
DROP POLICY IF EXISTS "Admins can manage system configs" ON public.system_configs;

CREATE POLICY "Admins can manage system configs"
ON public.system_configs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
