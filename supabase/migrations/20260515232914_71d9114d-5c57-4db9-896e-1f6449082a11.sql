-- 1. Adicionar colunas de metadados à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- 2. Atualizar a função handle_new_user para capturar metadados do Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    whatsapp = COALESCE(EXCLUDED.whatsapp, profiles.whatsapp);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'demo')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$$;

-- 3. Índice para performance em ai_chat_history
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON public.ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_created_at ON public.ai_chat_history(created_at DESC);
