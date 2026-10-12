import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import type { AiChatMessage } from '@/types/aiChat';

export const aiChatService = {
  async fetchChat(userId: string | null, signal: AbortSignal): Promise<AiChatMessage[]> {
      if (!isSupabaseEnabled() || !supabase || !userId) return [];
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('role, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(30)
        .abortSignal(signal);
      if (error) throw error;
      return (data ?? []) as AiChatMessage[];
  },
  async persistMessage(userId: string | null, { role, content }: AiChatMessage): Promise<void> {
      if (!isSupabaseEnabled() || !supabase || !userId) return;
      const { error } = await supabase.from('ai_chat_history').insert({ user_id: userId, role, content });
      if (error) throw error;
  },
  async clearChat(userId: string | null): Promise<void> {
    if (isSupabaseEnabled() && supabase && userId) {
      // Preserve the existing delete acknowledgement contract.
      await supabase.from('ai_chat_history').delete().eq('user_id', userId);
    }
  },
};
