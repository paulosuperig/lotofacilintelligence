import { useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { LotteryResult, SavedGame } from '@/types/lottery';
import { generateSecureId } from '@/lib/security/utils';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { lotteryService } from '@/services/lotteryService';
import { historyService } from '@/services/historyService';
import { trackCustom } from '@/lib/analytics/metaPixel';
import { gameSignature, type GenStrategy } from '@/lib/lottery/generator';
import { runLotteryTask } from '@/lib/lottery/runTask';
import { historyKey, latestResultKey, historyAnalysisKey } from '@/lib/lottery/queryKeys';
export { historyKey, latestResultKey, historyAnalysisKey } from '@/lib/lottery/queryKeys';
import { normalizeDraw, type HistoryAnalysis } from '@/lib/lottery/analysis';
import { useSessionUser } from './useSessionUser';
import type { SaveResult } from '@/lib/lottery/saveConfirmation';

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

export interface LotteryHookOptions { realtime?: boolean; analysis?: boolean }

export const useLottery = ({ realtime = false, analysis: loadAnalysis = true }: LotteryHookOptions = {}) => {
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
    enabled: loadAnalysis,
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

  const history = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);
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

  // One owner in AppShell; a batch of inserts causes one trailing refresh.
  useEffect(() => {
    if (!realtime || !userId || !isSupabaseEnabled() || !supabase) return;
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const client = supabase;
    const refresh = () => {
      if (!mounted) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (mounted) void queryClient.invalidateQueries({ queryKey: historyKey(userId), exact: true });
      }, 300);
    };
    const channel = client.channel(`games-history-${userId}`);
    try {
      channel.on('postgres_changes', {
        event: '*', schema: 'public', table: 'games_history', filter: `user_id=eq.${userId}`,
      }, refresh).subscribe((status, error) => {
        if (!mounted) return;
        if (error || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Realtime] Falha na inscrição:', error ?? status);
        }
        if (status === 'SUBSCRIBED') refresh();
      });
    } catch (error) {
      console.error('[Realtime] Falha ao conectar:', error);
    }
    return () => {
      mounted = false;
      clearTimeout(timer);
      void client.removeChannel(channel).catch((error: unknown) => console.error('[Realtime] Falha no cleanup:', error));
    };
  }, [realtime, userId, queryClient]);

  // -------------------------------------------------------------- mutations
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

  // ---------------------------------------------------------------- actions
  const fetchLatestResult = useCallback(async () => {
    await latestResultQuery.refetch();
  }, [latestResultQuery]);

  const loadHistory = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: historyKey(userId), exact: true, refetchType: "active" });
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
      if (!newGames || newGames.length === 0) return { success: false, duplicate: false, savedCount: 0 };

      const existing = queryClient.getQueryData<SavedGame[]>(historyKey(userId)) ?? history;
      const historySignatures = new Set(existing.map((saved) => signatureOf(saved.numbers)));
      const nonDuplicateNewGames = newGames.filter((g) => !historySignatures.has(signatureOf(g.numbers)));

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
        // toast/rollback já tratados no onError da mutation
        return { success: false, duplicate: false, savedCount: 0 };
      }
    },
    [history, queryClient, saveMutation, userId],
  );

  const generateSmartGame = useCallback(async (opts: SmartOptions = {}, signal?: AbortSignal) => {
    const avoid = new Set(history.map(g => gameSignature(g.numbers)));
    const previousDraw = latestResult ? normalizeDraw(latestResult.dezenas) : null;
    const strategy = opts.strategy ?? 'equilibrada';

    const result = await runLotteryTask({ kind: 'game', options: {
      analysis,
      previousDraw,
      avoid,
      strategy,
      fixed: opts.fixed,
      excluded: opts.excluded,
      ...pickFilters(opts),
    } }, signal);

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

  const generateSmartBatch = useCallback(async (count: number, opts: SmartOptions = {}, signal?: AbortSignal): Promise<SavedGame[]> => {
    const avoid = new Set(history.map(g => gameSignature(g.numbers)));
    const previousDraw = latestResult ? normalizeDraw(latestResult.dezenas) : null;
    const strategy = opts.strategy ?? 'equilibrada';

    const games = await runLotteryTask({ kind: 'batch', options: {
      count,
      analysis,
      previousDraw,
      avoid,
      strategy,
      fixed: opts.fixed,
      excluded: opts.excluded,
      ...pickFilters(opts),
    } }, signal);
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
