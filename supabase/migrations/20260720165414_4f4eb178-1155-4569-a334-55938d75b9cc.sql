
-- Fix: "Public Can Execute SECURITY DEFINER Function" for public.get_meta_pixel_id
-- Strategy: convert to SECURITY INVOKER and allow anon/authenticated to read only
-- the meta_pixel_id row in system_configs via RLS.

CREATE OR REPLACE FUNCTION public.get_meta_pixel_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT value->>'id'
  FROM public.system_configs
  WHERE key = 'meta_pixel_id'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_meta_pixel_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_meta_pixel_id() TO anon, authenticated;

-- Allow public read of ONLY the meta_pixel_id row (never the DeepSeek key or CAPI token)
GRANT SELECT ON public.system_configs TO anon;

DROP POLICY IF EXISTS "Public can read meta_pixel_id" ON public.system_configs;
CREATE POLICY "Public can read meta_pixel_id"
ON public.system_configs
FOR SELECT
TO anon, authenticated
USING (key = 'meta_pixel_id');
