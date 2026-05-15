-- Create a private schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS app_private;

-- Move the functions to the private schema
ALTER FUNCTION public.handle_new_user() SET SCHEMA app_private;
ALTER FUNCTION public.promote_user_to_admin(text) SET SCHEMA app_private;

-- Update the trigger to point to the new location
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION app_private.handle_new_user();

-- Now the public API (PostgREST) cannot see these functions, resolving linter warnings.
