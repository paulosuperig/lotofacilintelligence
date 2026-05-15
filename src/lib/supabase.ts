import { createClient } from '@supabase/supabase-js';
import { supabase as typedSupabase } from '@/integrations/supabase/client';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only initialize if URL is valid to prevent crash
export const supabase = supabaseUrl && supabaseUrl.startsWith('http') && supabasePublishableKey
  ? typedSupabase
  : null as typeof typedSupabase | null;

/**
 * Skill: Architecture Strategy
 * This utility handles the abstraction between LocalStorage (current) and Supabase (future).
 * When VITE_SUPABASE_URL is present, it will prioritize cloud storage.
 */
export const isSupabaseEnabled = () => {
  return !!supabaseUrl && supabaseUrl.startsWith('http') && !!supabasePublishableKey;
};
