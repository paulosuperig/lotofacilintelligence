import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL ou Anon Key não configuradas. Verifique as configurações no painel da Lovable.');
}

// Skill: Resilient Initialization
// Garante que o app não quebre se as variáveis estiverem ausentes
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

/**
 * Skill: @skillslovable - Full-Stack Security & Database Resilience
 * Banco de dados sincronizado e protegido.
 */
