import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiChatService } from '@/services/aiChatService';
import { aiChatKey } from '@/lib/ai/queryKeys';
import type { AiChatMessage } from '@/types/aiChat';
export type { AiChatMessage } from '@/types/aiChat';



export const useAiChat = (userId: string | null) => {
  const queryClient = useQueryClient();

  const chatQuery = useQuery<AiChatMessage[]>({
    queryKey: aiChatKey(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: ({ signal }) => aiChatService.fetchChat(userId, signal),
  });

  const aiChat = useMemo(() => chatQuery.data ?? [], [chatQuery.data]);

  const appendMessage = useCallback(
    (message: AiChatMessage) => {
      queryClient.setQueryData<AiChatMessage[]>(aiChatKey(userId), (prev) => [...(prev ?? []), message]);
    },
    [queryClient, userId],
  );

  const persistMutation = useMutation<void, Error, AiChatMessage>({
    mutationFn: (message) => aiChatService.persistMessage(userId, message),
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
    await aiChatService.clearChat(userId);
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
