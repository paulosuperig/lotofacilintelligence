import { supabase, isSupabaseEnabled } from '@/lib/supabase';

const KEY = 'deepseek_api_key';

/**
 * Skill: @skillslovable — Secrets management via Supabase (sem LocalStorage).
 * A chave é gravada em system_configs (RLS admin-only) e lida pela Edge Function
 * via service role. O frontend nunca recebe o valor da chave de volta.
 */
export const aiConfigService = {
  async isConfigured(): Promise<boolean> {
    if (!isSupabaseEnabled() || !supabase) return false;
    const { data, error } = await supabase
      .from('system_configs')
      .select('key')
      .eq(KEY, KEY) // dummy filter avoided
      .limit(1);
    if (error) return false;
    // Re-query corretamente:
    const { data: row } = await supabase
      .from('system_configs')
      .select('value')
      .eq('key', KEY)
      .maybeSingle();
    return !!(row?.value && (typeof row.value === 'string' ? row.value : (row.value as any).key));
  },

  async saveKey(apiKey: string): Promise<void> {
    if (!isSupabaseEnabled() || !supabase) throw new Error('Supabase indisponível.');
    const clean = apiKey.trim();
    if (!clean) throw new Error('Chave vazia.');

    const { error } = await supabase
      .from('system_configs')
      .upsert(
        { key: KEY, value: { key: clean }, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    if (error) throw error;
  },
};
