import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { UserProfile } from '@/types/lottery';

export const userService = {
  async fetchProfiles(page = 0, pageSize = 20): Promise<{ profiles: UserProfile[], total: number }> {
    if (!isSupabaseEnabled() || !supabase) return { profiles: [], total: 0 };
    
    const start = page * pageSize;
    const end = start + pageSize - 1;

    // Fetch total count and profiles in parallel
    const [countResult, dataResult] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true })
        .order('created_at', { ascending: false })
        .range(start, end)
    ]);
    
    if (dataResult.error) throw dataResult.error;
    
    const profiles = (dataResult.data || []).map((u) => ({
      ...u,
      createdAt: u.created_at || new Date().toISOString()
    })) as unknown as UserProfile[];

    return { 
      profiles, 
      total: countResult.count || 0 
    };
  },

  async updateProfile(userId: string, data: { role: 'admin' | 'demo'; status: 'active' | 'blocked' }) {
    if (!isSupabaseEnabled() || !supabase) return;

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
  },

  async updatePassword(userId: string, password: string) {
    if (!isSupabaseEnabled() || !supabase) return { error: new Error('Supabase not enabled') };

    const { data, error } = await supabase.functions.invoke('admin-reset-password', {
      body: { userId, newPassword: password },
    });
    if (error) return { error };
    if (data?.error) return { error: new Error(data.error) };
    return { error: null };
  }
};
