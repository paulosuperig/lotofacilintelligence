-- Update handle_new_user to include metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status, full_name, whatsapp)
  VALUES (
    new.id, 
    new.email, 
    'demo', 
    'active',
    (new.raw_user_meta_data->>'full_name'),
    (new.raw_user_meta_data->>'whatsapp')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'demo');

  RETURN new;
END;
$$;
