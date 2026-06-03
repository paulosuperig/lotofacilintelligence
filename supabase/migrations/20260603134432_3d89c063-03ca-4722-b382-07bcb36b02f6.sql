-- Tighten the self-update policy to prevent role/status escalation
-- Even though we have a trigger, defense-in-depth with RLS WITH CHECK is best practice.

DROP POLICY IF EXISTS "Profiles - Self Update" ON public.profiles;

CREATE POLICY "Profiles - Self Update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role   = (SELECT p.role   FROM public.profiles p WHERE p.id = auth.uid())
  AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
);