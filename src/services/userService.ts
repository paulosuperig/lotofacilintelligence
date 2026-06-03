import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { UserProfile } from '@/types/lottery';

export const userService = {
  async fetchProfiles(): Promise<UserProfile[]> {
    if (!isSupabaseEnabled() || !supabase) return [];
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map((u: any) => ({
      ...u,
      createdAt: u.created_at || new Date().toISOString()
    })) as UserProfile[];
  },

  async updateProfile(userId: string, data: { role: 'admin' | 'demo'; status: 'active' | 'blocked' }) {
    if (!isSupabaseEnabled() || !supabase) return;

    // O trigger 'on_profile_change_sync_role' no banco de dados cuidará 
    // automaticamente da sincronização com a tabela 'user_roles'.
    const { error } = await supabase
      .from('profiles')
      .update({
        role: data.role,
        status: data.status
      })
      .eq('id', userId);
    
    if (error) throw error;
  },

  async deleteProfile(userId: string) {
    if (!isSupabaseEnabled() || !supabase) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
  },

  async updateStatus(userId: string, status: 'active' | 'blocked') {
    if (!isSupabaseEnabled() || !supabase) return;

    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);
    
    if (error) throw error;
  }
};
