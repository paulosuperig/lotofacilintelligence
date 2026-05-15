-- Fix linter warnings by explicitly setting search_path to public for SECURITY DEFINER functions

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.promote_user_to_admin(text) SET search_path = public;
