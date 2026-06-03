import { supabase, isSupabaseEnabled } from '@/lib/supabase';

const KEY = 'deepseek_api_key';

/**
 * Skill: @skillslovable — Secrets via Supabase (sem LocalStorage).
 * Grava em system_configs (RLS admin-only). Edge Function lê via service role.
 * Frontend nunca recebe o valor da chave de volta.
 */
export const aiConfigService = {
  async isConfigured(): Promise<boolean> {
    if (!isSupabaseEnabled() || !supabase) return false;
    const { data, error } = await supabase
      .from('system_configs')
      .select('value')
      .eq('key', KEY)
      .maybeSingle();
    if (error || !data) return false;
    const v: any = data.value;
    return !!(v && (typeof v === 'string' ? v : v.key));
  },

  async saveKey(apiKey: string): Promise<void> {
    if (!isSupabaseEnabled() || !supabase) throw new Error('Supabase indisponível.');
    const clean = apiKey.trim();
    if (!clean) throw new Error('Chave vazia.');

    const { error } = await supabase
      .from('system_configs')
      .upsert(
        { key: KEY, value: { key: clean } as any, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    if (error) throw error;
  },
};
