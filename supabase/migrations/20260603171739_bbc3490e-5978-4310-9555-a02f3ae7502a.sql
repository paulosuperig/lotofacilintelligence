CREATE OR REPLACE FUNCTION public.get_meta_pixel_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT value->>'id' FROM public.system_configs WHERE key = 'meta_pixel_id'),
    NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_meta_pixel_id() TO anon, authenticated;