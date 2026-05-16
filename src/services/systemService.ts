import { supabase } from '@/integrations/supabase/client';

export const systemService = {
  async getDeepSeekKey() {
    const { data } = await supabase
      .from('system_configs')
      .select('value')
      .eq('key', 'deepseek_api_key')
      .maybeSingle();
    
    return data?.value ? String(data.value) : null;
  },

  async saveDeepSeekKey(key: string) {
    const { error } = await supabase
      .from('system_configs')
      .upsert({ key: 'deepseek_api_key', value: key }, { onConflict: 'key' });
    
    if (error) throw error;
  }
};
