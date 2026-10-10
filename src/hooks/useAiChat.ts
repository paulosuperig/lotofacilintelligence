import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

export type AiChatMessage = { role: 'user' | 'assistant'; content: string };
const aiChatKey = (userId: string | null) => ['ai_chat_history', userId] as const;

export const useAiChat = (userId: string | null) => {
  const queryClient = useQueryClient();

  const chatQuery = useQuery<AiChatMessage[]>({
    queryKey: aiChatKey(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }) => {
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
  });

  const aiChat = useMemo(() => chatQuery.data ?? [], [chatQuery.data]);

  const appendMessage = useCallback(
    (message: AiChatMessage) => {
      queryClient.setQueryData<AiChatMessage[]>(aiChatKey(userId), (prev) => [...(prev ?? []), message]);
    },
    [queryClient, userId],
  );

  const persistMutation = useMutation<void, Error, AiChatMessage>({
    mutationFn: async ({ role, content }) => {
      if (!isSupabaseEnabled() || !supabase || !userId) return;
      const { error } = await supabase.from('ai_chat_history').insert({ user_id: userId, role, content });
      if (error) throw error;
    },
    onError: (error) => {
      console.error('[AI] Error persisting chat message:', error);
    },
  });

  const persistChatMessage = useCallback(
    (role: 'user' | 'assistant', content: string) => {
      persistMutation.mutate({ role, content });
    },
    [persistMutation],
  );

  const clearChatHistory = useCallback(async () => {
    if (isSupabaseEnabled() && supabase && userId) {
      await supabase.from('ai_chat_history').delete().eq('user_id', userId);
    }
    queryClient.setQueryData<AiChatMessage[]>(aiChatKey(userId), []);
    queryClient.invalidateQueries({ queryKey: aiChatKey(userId) });
  }, [queryClient, userId]);

  return {
    aiChat,
    appendMessage,
    persistChatMessage,
    clearChatHistory,
    isLoading: chatQuery.isLoading,
  };
};
