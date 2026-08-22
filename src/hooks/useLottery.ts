import { useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { LotteryResult, SavedGame } from '@/types/lottery';
import { generateSecureId } from '@/lib/security/utils';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { lotteryService } from '@/services/lotteryService';
import { historyService } from '@/services/historyService';
import { trackCustom } from '@/lib/analytics/metaPixel';
import { generateOptimizedGame, generateBatch, gameSignature, type GenStrategy } from '@/lib/lottery/generator';
import { normalizeDraw, type HistoryAnalysis } from '@/lib/lottery/analysis';
import { useSessionUser } from './useSessionUser';
import type { RealtimeChannel } from '@supabase/supabase-js';

/** Filtros avançados (faixas soft) escolhidos pelo usuário. */
export interface SmartFilters {
  sumMin?: number;
  sumMax?: number;
  paresMin?: number;
  paresMax?: number;
  primosMin?: number;
  primosMax?: number;
  seqMax?: number;
}

/** Opções de composição escolhidas na UI (estratégia + restrições + filtros). */
interface SmartOptions extends SmartFilters {
  strategy?: GenStrategy;
  fixed?: number[];
  excluded?: number[];
}

/** Extrai apenas os campos de filtro (faixas soft) das opções. */
const pickFilters = (o: SmartOptions): SmartFilters => ({
  sumMin: o.sumMin,
  sumMax: o.sumMax,
  paresMin: o.paresMin,
  paresMax: o.paresMax,
  primosMin: o.primosMin,
  primosMax: o.primosMax,
  seqMax: o.seqMax,
});

const STRATEGY_LABEL: Record<GenStrategy, string> = {
  equilibrada: 'Equilibrada',
  quentes: 'Quentes',
  atrasadas: 'Atrasadas',
  repetidas: 'Repetidas',
  ciclo: 'Ciclo',
  agressiva: 'Agressiva',
  surpresinha: 'Surpresinha',
};

/** Assinatura canônica de um jogo (usada na deduplicação do histórico). */
const signatureOf = (numbers: number[]) => [...numbers].sort((a, b) => a - b).join(',');

export const historyKey = (userId: string | null) => ['games_history', userId] as const;
export const latestResultKey = ['latest_result'] as const;
export const historyAnalysisKey = ['history_analysis'] as const;

interface SaveResult { success: boolean; duplicate: boolean }

export const useLottery = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userId } = useSessionUser();

  // ---------------------------------------------------------------- queries
  const latestResultQuery = useQuery<LotteryResult | null>({
    queryKey: latestResultKey,
    queryFn: () => lotteryService.getLatestResult(),
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });

  const analysisQuery = useQuery<HistoryAnalysis | null>({
    queryKey: historyAnalysisKey,
    queryFn: () => lotteryService.getHistoryAnalysis(),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  const historyQuery = useQuery<SavedGame[]>({
    queryKey: historyKey(userId),
    queryFn: () => (userId ? historyService.fetchHistory(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const history = historyQuery.data ?? [];
  const latestResult = latestResultQuery.data ?? null;
  const analysis = analysisQuery.data ?? null;

  // Erro de rede no resultado oficial: mantém o feedback que a UI já exibia.
  useEffect(() => {
    if (latestResultQuery.isError) {
      console.error('[Lottery] Error fetching latest result:', latestResultQuery.error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível buscar o último resultado. Verifique sua conexão.',
        variant: 'destructive',
      });
    }
  }, [latestResultQuery.isError, latestResultQuery.error, toast]);

  // -------------------------------------------------------------- realtime
  useEffect(() => {
    if (!userId || !isSupabaseEnabled() || !supabase) return;
    const client = supabase;
    const channel: RealtimeChannel = client
      .channel(`games-history-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games_history',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: historyKey(userId) });
        },
      );

    // Conecta o canal ANTES de inscrever no postgres_changes se necessário,
    // mas o padrão recomendado é configurar tudo e depois chamar subscribe().
    // O erro "cannot add callbacks after subscribe()" ocorre se .on() for chamado
    // em um objeto de canal que já teve .subscribe() invocado.
    channel.subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // -------------------------------------------------------------- mutations
  const saveMutation = useMutation<SavedGame[], Error, SavedGame[], { previous?: SavedGame[] }>({
    mutationFn: async (games) => {
      if (!userId) throw new Error('Sessão expirada. Faça login novamente.');
      return historyService.saveGames(userId, games);
    },
    onMutate: async (games) => {
      await queryClient.cancelQueries({ queryKey: historyKey(userId) });
      const previous = queryClient.getQueryData<SavedGame[]>(historyKey(userId));
      queryClient.setQueryData<SavedGame[]>(historyKey(userId), [...games, ...(previous ?? [])]);
      return { previous };
    },
    onError: (error, _games, context) => {
      queryClient.setQueryData<SavedGame[]>(historyKey(userId), context?.previous ?? []);
      console.error('[Lottery] Error saving history:', error);
      toast({
        title: 'Erro na persistência',
        description: 'Não foi possível sincronizar o histórico.',
        variant: 'destructive',
      });
    },
    onSuccess: (updatedHistory) => {
      queryClient.setQueryData<SavedGame[]>(historyKey(userId), updatedHistory);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: historyKey(userId) });
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
      queryClient.invalidateQueries({ queryKey: historyKey(userId) });
    },
  });

  // ---------------------------------------------------------------- actions
  const fetchLatestResult = useCallback(async () => {
    await latestResultQuery.refetch();
  }, [latestResultQuery]);

  const loadHistory = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: historyKey(userId) });
  }, [queryClient, userId]);

  const clearHistory = useCallback(async () => {
    await clearMutation.mutateAsync();
  }, [clearMutation]);

  const isGameDuplicate = useCallback(
    (numbers: number[]) => {
      const signature = signatureOf(numbers);
      return history.some((saved) => signatureOf(saved.numbers) === signature);
    },
    [history],
  );

  const saveToHistory = useCallback(
    async (newGames: SavedGame[]): Promise<SaveResult> => {
      if (!newGames || newGames.length === 0) return { success: false, duplicate: false };

      const existing = queryClient.getQueryData<SavedGame[]>(historyKey(userId)) ?? history;
      const historySignatures = new Set(existing.map((saved) => signatureOf(saved.numbers)));
      const nonDuplicateNewGames = newGames.filter((g) => !historySignatures.has(signatureOf(g.numbers)));

      if (nonDuplicateNewGames.length === 0) return { success: false, duplicate: true };

      const securedGames: SavedGame[] = nonDuplicateNewGames.map((game) => ({
        ...game,
        id: game.id || generateSecureId(),
        timestamp: game.timestamp || Date.now(),
      }));

      try {
        await saveMutation.mutateAsync(securedGames);
        trackCustom('SalvarJogo', {
          content_category: 'history',
          content_ids: securedGames.map((g) => g.id),
          num_items: securedGames.length,
          value: securedGames.length * 3.5,
          currency: 'BRL',
        });
        return { success: true, duplicate: false };
      } catch {
        // toast/rollback já tratados no onError da mutation
        return { success: false, duplicate: false };
      }
    },
    [history, queryClient, saveMutation, userId],
  );

  const generateSmartGame = useCallback((opts: SmartOptions = {}) => {
    const avoid = new Set(history.map(g => gameSignature(g.numbers)));
    const previousDraw = latestResult ? normalizeDraw(latestResult.dezenas) : null;
    const strategy = opts.strategy ?? 'equilibrada';

    const result = generateOptimizedGame({
      analysis,
      previousDraw,
      avoid,
      strategy,
      fixed: opts.fixed,
      excluded: opts.excluded,
      ...pickFilters(opts),
    });

    const label = STRATEGY_LABEL[strategy];
    return {
      id: generateSecureId(),
      numbers: result.numbers,
      timestamp: Date.now(),
      sum: result.sum,
      quality: result.score,
      type: result.dataDriven ? `Gerador ${label} (dados)` : `Gerador ${label}`,
    };
  }, [history, analysis, latestResult]);

  const generateSmartBatch = useCallback((count: number, opts: SmartOptions = {}): SavedGame[] => {
    const avoid = new Set(history.map(g => gameSignature(g.numbers)));
    const previousDraw = latestResult ? normalizeDraw(latestResult.dezenas) : null;
    const strategy = opts.strategy ?? 'equilibrada';

    const games = generateBatch({
      count,
      analysis,
      previousDraw,
      avoid,
      strategy,
      fixed: opts.fixed,
      excluded: opts.excluded,
      ...pickFilters(opts),
    });
    const label = STRATEGY_LABEL[strategy];
    return games.map((g) => ({
      id: generateSecureId(),
      numbers: g.numbers,
      timestamp: Date.now(),
      sum: g.sum,
      quality: g.score,
      type: g.dataDriven ? `Lote ${label} (dados)` : `Lote ${label}`,
    }));
  }, [history, analysis, latestResult]);

  return {
    latestResult,
    isLoading: latestResultQuery.isLoading,
    isRefreshing: latestResultQuery.isFetching,
    history,
    analysis,
    fetchLatestResult,
    clearHistory,
    loadHistory,
    saveToHistory,
    generateSmartGame,
    generateSmartBatch,
    isGameDuplicate,
  };
};
