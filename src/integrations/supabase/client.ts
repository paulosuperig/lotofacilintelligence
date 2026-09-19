import { createClient } from '@supabase/supabase-js';
import { Database } from './types';
import { SUPABASE_PUBLISHABLE_KEY_FALLBACK, SUPABASE_URL_FALLBACK } from './config';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL_FALLBACK;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  SUPABASE_PUBLISHABLE_KEY_FALLBACK;

// Skill: Resilient Initialization
// O app nunca quebra por ausência de variáveis de ambiente no build.
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey);

/**
 * Skill: @skillslovable - Full-Stack Security & Database Resilience
 * Banco de dados sincronizado e protegido.
 */
