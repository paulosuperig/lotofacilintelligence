import { useMemo, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../use-toast';
import { SavedGame } from '@/types/lottery';
import { generateSecureId } from '@/lib/security/utils';
import { useLotteryRealtime } from '../useLotteryRealtime';
import { historyService } from '@/services/historyService';
import { trackCustom } from '@/lib/analytics/metaPixel';
import { historyKey } from '@/lib/lottery/queryKeys';
import { useSessionUser } from '../useSessionUser';
import type { SaveResult } from '@/lib/lottery/saveConfirmation';

import { gameSignature } from '@/lib/lottery/gameSignature';

export const useLotteryHistory = (realtime = false) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userId } = useSessionUser();

  const historyQuery = useQuery<SavedGame[]>({
    queryKey: historyKey(userId),
    queryFn: () => (userId ? historyService.fetchHistory(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const history = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);
  
  // Otimização: Cache de assinaturas para busca O(1)
  const historySignatures = useMemo(() => 
    new Set(history.map((saved) => gameSignature(saved.numbers))),
    [history]
  );

  useLotteryRealtime({ realtime, userId });

  const saveMutation = useMutation<SavedGame[], Error, SavedGame[]>({
    mutationFn: async (games) => {
      if (!userId) throw new Error('Sessão expirada. Faça login novamente.');
      return historyService.saveGames(userId, games);
    },
    onError: (error) => {
      console.error('[Lottery] Error saving history:', error);
      toast({ title: 'Erro na persistência', description: 'Não foi possível sincronizar o histórico.', variant: 'destructive' });
    },
    onSuccess: (savedGames) => {
      queryClient.setQueryData<SavedGame[]>(historyKey(userId), (previous = []) => {
        const ids = new Set(savedGames.map((game) => game.id));
        return [...savedGames, ...previous.filter((game) => !ids.has(game.id))]
          .sort((a, b) => b.timestamp - a.timestamp).slice(0, 100);
      });
    },
  });

  const clearMutation = useMutation<void, Error, void, { previous?: SavedGame[] }>({
    mutationFn: async () => { await historyService.clearHistory(userId); },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: historyKey(userId) });
      const previous = queryClient.getQueryData<SavedGame[]>(historyKey(userId));
      queryClient.setQueryData<SavedGame[]>(historyKey(userId), []);
      return { previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData<SavedGame[]>(historyKey(userId), context?.previous ?? []);
      console.error('[useLottery] Erro ao limpar histórico:', error);
      toast({
        title: 'Erro ao limpar',
        description: 'Não foi possível remover o histórico. Tente novamente.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({ title: 'Histórico limpo', description: 'Todos os seus jogos foram removidos.' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: historyKey(userId), exact: true, refetchType: "active" });
    },
  });

  const saveToHistory = useCallback(
    async (newGames: SavedGame[]): Promise<SaveResult> => {
      if (!newGames || newGames.length === 0) return { success: false, duplicate: false, savedCount: 0 };

      // Usando o Set otimizado
      const nonDuplicateNewGames = newGames.filter((g) => !historySignatures.has(gameSignature(g.numbers)));

      if (nonDuplicateNewGames.length === 0) return { success: false, duplicate: true, savedCount: 0 };

      const securedGames: SavedGame[] = nonDuplicateNewGames.map((game) => ({
        ...game,
        id: game.id || generateSecureId(),
        timestamp: game.timestamp || Date.now(),
      }));

      try {
        const savedGames = await saveMutation.mutateAsync(securedGames);
        trackCustom('SalvarJogo', {
          content_category: 'history',
          content_ids: securedGames.map((g) => g.id),
          num_items: securedGames.length,
          value: securedGames.length * 3.5,
          currency: 'BRL',
        });
        return { success: savedGames.length > 0, duplicate: false, savedCount: savedGames.length };
      } catch {
        return { success: false, duplicate: false, savedCount: 0 };
      }
    },
    [historySignatures, saveMutation],
  );

  const clearHistory = useCallback(async () => {
    await clearMutation.mutateAsync();
  }, [clearMutation]);

  const loadHistory = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: historyKey(userId), exact: true, refetchType: 'active' });
  }, [queryClient, userId]);

  const isGameDuplicate = useCallback((numbers: number[]) => {
    return historySignatures.has(gameSignature(numbers));
  }, [historySignatures]);

  return { history, saveToHistory, clearHistory, loadHistory, isGameDuplicate };
};
