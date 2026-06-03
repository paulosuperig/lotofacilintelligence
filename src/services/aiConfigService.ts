import { supabase, isSupabaseEnabled } from '@/lib/supabase';

const KEY = 'deepseek_api_key';
const PIXEL_KEY = 'meta_pixel_id';
const CAPI_KEY = 'meta_capi_token';
const TEST_CODE_KEY = 'meta_test_event_code';

/**
 * Skill: @skillslovable — Configurações de sistema via Supabase.
 * - DeepSeek API Key: gravada em system_configs (RLS admin-only). Frontend nunca lê o valor.
 * - Meta Pixel ID: gravado em system_configs e exposto publicamente via RPC `get_meta_pixel_id`.
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

  /** Lê o Pixel ID via RPC pública (não requer auth). */
  async getMetaPixelId(): Promise<string | null> {
    if (!isSupabaseEnabled() || !supabase) return null;
    const { data, error } = await (supabase as any).rpc('get_meta_pixel_id');
    if (error) {
      console.warn('[Pixel] RPC error:', error.message);
      return null;
    }
    return (data as string) || null;
  },

  /** Apenas admin (RLS) pode gravar. */
  async saveMetaPixelId(pixelId: string): Promise<void> {
    if (!isSupabaseEnabled() || !supabase) throw new Error('Supabase indisponível.');
    const clean = pixelId.trim();
    if (!/^\d{6,20}$/.test(clean)) throw new Error('ID do Pixel inválido (apenas dígitos, 6 a 20 caracteres).');

    const { error } = await supabase
      .from('system_configs')
      .upsert(
        { key: PIXEL_KEY, value: { id: clean } as any, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    if (error) throw error;
  },

  async isPixelConfigured(): Promise<boolean> {
    const id = await this.getMetaPixelId();
    return !!id;
  },

  /** Apenas admin (RLS) pode gravar. O frontend NUNCA lê este valor de volta por segurança. */
  async saveMetaCapiToken(token: string): Promise<void> {
    if (!isSupabaseEnabled() || !supabase) throw new Error('Supabase indisponível.');
    const clean = token.trim();
    if (!clean) throw new Error('Token CAPI vazio.');

    const { error } = await supabase
      .from('system_configs')
      .upsert(
        { key: CAPI_KEY, value: { token: clean } as any, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    if (error) throw error;
  },

  async saveMetaTestEventCode(code: string): Promise<void> {
    if (!isSupabaseEnabled() || !supabase) throw new Error('Supabase indisponível.');
    const clean = code.trim();

    const { error } = await supabase
      .from('system_configs')
      .upsert(
        { key: TEST_CODE_KEY, value: { code: clean } as any, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    if (error) throw error;
  },

  /** 
   * Retorna se o CAPI está configurado (apenas o fato de existir, não o valor).
   * Útil para o Admin UI mostrar o status.
   */
  async getMetaCapiStatus(): Promise<{ token: boolean; testCode: string | null }> {
    if (!isSupabaseEnabled() || !supabase) return { token: false, testCode: null };
    
    // Tentamos ler (se for admin o RLS permitirá ver que a linha existe)
    const { data: tokenData } = await supabase
      .from('system_configs')
      .select('value')
      .eq('key', CAPI_KEY)
      .maybeSingle();

    const { data: testData } = await supabase
      .from('system_configs')
      .select('value')
      .eq('key', TEST_CODE_KEY)
      .maybeSingle();

    return {
      token: !!tokenData,
      testCode: (testData?.value as any)?.code || null
    };
  },
};
