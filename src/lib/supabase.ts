import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only initialize if URL is valid to prevent crash
export const supabase = supabaseUrl && supabaseUrl.startsWith('http') 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

/**
 * Skill: Architecture Strategy
 * This utility handles the abstraction between LocalStorage (current) and Supabase (future).
 * When VITE_SUPABASE_URL is present, it will prioritize cloud storage.
 */
export const isSupabaseEnabled = () => {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
};
