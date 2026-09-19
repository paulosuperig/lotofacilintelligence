import { supabase as typedSupabase } from '@/integrations/supabase/client';

// Fonte única do cliente Supabase. O módulo de integração já resolve as
// variáveis da hospedagem e os valores públicos de fallback; repetir essa
// validação aqui desativava o histórico enquanto a autenticação seguia ativa.
export const supabase = typedSupabase;

/**
 * Compatibilidade para os serviços que ainda consultam a disponibilidade.
 * Se o cliente foi criado, todos os fluxos usam a mesma conexão configurada.
 */
export const isSupabaseEnabled = () => true;
