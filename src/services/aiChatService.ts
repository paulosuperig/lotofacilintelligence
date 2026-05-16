import { supabase } from '@/integrations/supabase/client';

export const aiChatService = {
  async fetchChatHistory(userId: string, limit: number = 30) {
    const { data, error } = await supabase
      .from('ai_chat_history')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  async persistMessage(userId: string, role: 'user' | 'assistant', content: string) {
    const { error } = await supabase.from('ai_chat_history').insert({
      user_id: userId,
      role,
      content
    });
    
    if (error) throw error;
  },

  async clearHistory(userId: string) {
    const { error } = await supabase
      .from('ai_chat_history')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
  }
};
