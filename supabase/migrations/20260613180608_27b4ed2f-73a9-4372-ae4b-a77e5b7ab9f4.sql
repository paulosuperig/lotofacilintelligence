
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, role, status, full_name, whatsapp)
  VALUES (
    new.id,
    new.email,
    'demo',
    'active',
    NULLIF(new.raw_user_meta_data->>'full_name', ''),
    NULLIF(new.raw_user_meta_data->>'whatsapp', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    whatsapp  = COALESCE(EXCLUDED.whatsapp,  public.profiles.whatsapp);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'demo')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$function$;
