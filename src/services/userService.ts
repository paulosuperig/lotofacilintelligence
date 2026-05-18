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

  async updateProfile(userId: string, data: { role: string; status: string }) {
    if (!isSupabaseEnabled() || !supabase) return;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: data.role,
        status: data.status
      })
      .eq('id', userId);
    
    if (profileError) throw profileError;

    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: data.role }, { onConflict: 'user_id,role' });
    
    if (roleError) throw roleError;
  },

  async deleteProfile(userId: string) {
    if (!isSupabaseEnabled() || !supabase) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
  },

  async updateStatus(userId: string, status: string) {
    if (!isSupabaseEnabled() || !supabase) return;

    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);
    
    if (error) throw error;
  }
};
