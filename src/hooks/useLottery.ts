import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { LotteryResult, SavedGame } from '@/types/lottery';
import { generateSecureId } from '@/lib/security/utils';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { lotteryService } from '@/services/lotteryService';
import { historyService } from '@/services/historyService';
import { trackCustom } from '@/lib/analytics/metaPixel';

type SaveResult = { success: boolean; duplicate: boolean };

const sortedSignature = (numbers: number[]) => [...numbers].sort((a, b) => a - b).join(',');

const fetchSessionUserId = async (): Promise<string | null> => {
  if (!isSupabaseEnabled() || !supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
};

/**
 * Estado servidor via TanStack Query. Duas instâncias do hook (Index e
 * GameGenerator) compartilham o mesmo cache — o histórico fica sincronizado
 * automaticamente, sem o antigo CustomEvent global.
 */
export const useLottery = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ---- Sessão (chave das queries por usuário) ----
  const { data: userId = null } = useQuery({
    queryKey: ['auth', 'session-user-id'],
    queryFn: fetchSessionUserId,
    staleTime: Infinity,
  });

  // ---- Último resultado da loteria ----
  const latestQuery = useQuery<LotteryResult>({
    queryKey: ['lottery', 'latest'],
    queryFn: () => lotteryService.getLatestResult(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (latestQuery.isError) {
      console.error('[Lottery] Error fetching latest result:', latestQuery.error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível buscar o último resultado. Verifique sua conexão.',
        variant: 'destructive',
      });
    }
  }, [latestQuery.isError, latestQuery.error, toast]);

  // ---- Histórico do usuário ----
  const historyKey = ['history', userId] as const;
  const historyQuery = useQuery<SavedGame[]>({
    queryKey: historyKey,
    queryFn: () => (userId ? historyService.fetchHistory(userId) : Promise.resolve([])),
    enabled: isSupabaseEnabled() && !!userId,
    staleTime: 30 * 1000,
  });

  const history = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);

  // Realtime: invalida o cache quando as linhas do usuário mudam.
  // Sufixo único por instância evita colisão de nome entre múltiplos consumidores.
  const channelIdRef = useRef<string>(generateSecureId());
  useEffect(() => {
    if (!isSupabaseEnabled() || !supabase || !userId) return;
    const channel = supabase
      .channel(`games-history-${userId}-${channelIdRef.current}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games_history', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: ['history', userId] }),
      )
      .subscribe();
    return () => {
      supabase?.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const fetchLatestResult = useCallback(() => latestQuery.refetch(), [latestQuery]);

  const loadHistory = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['history', userId] }),
    [queryClient, userId],
  );

  const isGameDuplicate = useCallback(
    (numbers: number[]) => {
      const signature = sortedSignature(numbers);
      return history.some((saved) => sortedSignature(saved.numbers) === signature);
    },
    [history],
  );

  const saveToHistory = useCallback(
    async (newGames: SavedGame[]): Promise<SaveResult> => {
      try {
        if (!newGames || newGames.length === 0) return { success: false, duplicate: false };

        const existing = new Set(history.map((g) => sortedSignature(g.numbers)));
        const nonDuplicate = newGames.filter((g) => !existing.has(sortedSignature(g.numbers)));
        if (nonDuplicate.length === 0) return { success: false, duplicate: true };

        const securedGames: SavedGame[] = nonDuplicate.map((game) => ({
          ...game,
          id: game.id || generateSecureId(),
          timestamp: game.timestamp || Date.now(),
        }));

        const currentUserId = userId ?? (await fetchSessionUserId());
        if (!currentUserId) throw new Error('Sessão expirada. Faça login novamente.');

        const updatedHistory = await historyService.saveGames(currentUserId, securedGames);
        queryClient.setQueryData(['history', currentUserId], updatedHistory);

        trackCustom('SalvarJogo', {
          content_category: 'history',
          content_ids: securedGames.map((g) => g.id),
          num_items: securedGames.length,
          value: securedGames.length * 3.5,
          currency: 'BRL',
        });
        return { success: true, duplicate: false };
      } catch (error) {
        console.error('[Lottery] Error saving history:', error);
        toast({
          title: 'Erro na persistência',
          description: 'Não foi possível sincronizar o histórico.',
          variant: 'destructive',
        });
        return { success: false, duplicate: false };
      }
    },
    [history, userId, queryClient, toast],
  );

  const clearHistory = useCallback(async () => {
    const previousHistory = history;
    queryClient.setQueryData(['history', userId], []);
    try {
      const currentUserId = userId ?? (await fetchSessionUserId());
      await historyService.clearHistory(currentUserId);
      toast({ title: 'Histórico limpo', description: 'Todos os seus jogos foram removidos.' });
    } catch (error) {
      console.error('[useLottery] Erro ao limpar histórico:', error);
      queryClient.setQueryData(['history', userId], previousHistory);
      toast({
        title: 'Erro ao limpar',
        description: 'Não foi possível remover o histórico. Tente novamente.',
        variant: 'destructive',
      });
    }
  }, [history, userId, queryClient, toast]);

  const generateSmartGame = useCallback((): SavedGame => {
    const pool = Array.from({ length: 25 }, (_, i) => i + 1);
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
    const moldNumbers = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
    const historySignatures = new Set(history.map((g) => sortedSignature(g.numbers)));

    let attempts = 0;
    let finalGame: number[] = [];
    let valid = false;

    while (!valid && attempts < 500) {
      attempts++;
      const numbers: number[] = [];
      const randomValues = new Uint32Array(15);
      window.crypto.getRandomValues(randomValues);
      const localPool = [...pool];
      for (let i = 0; i < 15; i++) {
        const randomIndex = randomValues[i] % localPool.length;
        numbers.push(localPool.splice(randomIndex, 1)[0]);
      }
      const sorted = numbers.sort((a, b) => a - b);
      const signature = sorted.join(',');
      if (historySignatures.has(signature)) continue;

      const evenCount = sorted.filter((n) => n % 2 === 0).length;
      const sum = sorted.reduce((a, b) => a + b, 0);
      const pCount = sorted.filter((n) => primes.includes(n)).length;
      const moldCount = sorted.filter((n) => moldNumbers.includes(n)).length;

      const checkParity = evenCount >= 7 && evenCount <= 8;
      const checkPrimes = pCount >= 5 && pCount <= 6;
      const checkMold = moldCount >= 9 && moldCount <= 11;
      const checkSum = sum >= 170 && sum <= 220;

      if (attempts < 250) {
        if (checkParity && checkPrimes && checkSum && checkMold) { finalGame = sorted; valid = true; }
      } else if ((checkParity && checkSum) || attempts > 450) {
        finalGame = sorted; valid = true;
      }
    }

    return {
      id: generateSecureId(),
      numbers: finalGame,
      timestamp: Date.now(),
      sum: finalGame.reduce((a, b) => a + b, 0),
      type: 'Gerador Inteligente',
    };
  }, [history]);

  return {
    latestResult: latestQuery.data ?? null,
    isLoading: latestQuery.isLoading,
    isRefreshing: latestQuery.isFetching && !latestQuery.isLoading,
    history,
    fetchLatestResult,
    clearHistory,
    loadHistory,
    saveToHistory,
    generateSmartGame,
    isGameDuplicate,
  };
};
