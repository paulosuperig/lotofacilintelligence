import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn('Supabase URL ou Publishable Key não configuradas. Verifique a conexão Supabase no painel da Lovable.');
}

// Skill: Resilient Initialization
// Garante que o app não quebre se as variáveis estiverem ausentes
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabasePublishableKey || 'placeholder-key'
);

/**
 * Skill: @skillslovable - Full-Stack Security & Database Resilience
 * Banco de dados sincronizado e protegido.
 */
