-- 1. Tabela para persistência do histórico do chat da IA
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para ai_chat_history
CREATE POLICY "Users can manage their own chat history"
ON public.ai_chat_history
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Índices de Performance para games_history
CREATE INDEX IF NOT EXISTS idx_games_history_user_id ON public.games_history(user_id);
CREATE INDEX IF NOT EXISTS idx_games_history_created_at ON public.games_history(created_at DESC);

-- 3. Habilitar Realtime
-- Nota: Para habilitar realtime via SQL em tabelas específicas
ALTER PUBLICATION supabase_realtime ADD TABLE public.games_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 4. Garantir que o perfil e roles sejam consistentes
-- Pequeno ajuste no handle_new_user para garantir unicidade e logs
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (new.id, new.email, 'demo', 'active')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'demo')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$$;
