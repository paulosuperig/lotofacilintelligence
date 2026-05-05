import { createClient } from '@supabase/supabase-js';

// Essas variáveis serão configuradas no Lovable Dashboard / Secrets
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL ou Anon Key não configuradas. A integração com banco de dados está pendente.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * DATABASE SCHEMA REFERENCE (FOR SUBSEQUENT MIGRATION)
 * 
 * TABLE: profiles
 * - id: uuid (references auth.users)
 * - email: text
 * - role: text (admin, demo)
 * - status: text (active, blocked)
 * - created_at: timestamptz
 * 
 * TABLE: games_history
 * - id: uuid
 * - user_id: uuid (references auth.users)
 * - numbers: int[]
 * - type: text (IA Insight, Manual, Modelo)
 * - model_name: text (optional)
 * - created_at: timestamptz
 * 
 * TABLE: system_configs
 * - key: text (primary key)
 * - value: jsonb
 */
