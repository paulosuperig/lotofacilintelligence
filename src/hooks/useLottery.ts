import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';
import { LotteryResult, SavedGame } from '@/types/lottery';
import { generateSecureId } from '@/lib/security/utils';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { lotteryService } from '@/services/lotteryService';
import { historyService } from '@/services/historyService';
import { trackCustom } from '@/lib/analytics/metaPixel';
import { generateOptimizedGame, generateBatch, gameSignature, type GenStrategy } from '@/lib/lottery/generator';
import { normalizeDraw, type HistoryAnalysis } from '@/lib/lottery/analysis';
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
};

export const useLottery = () => {
  const { toast } = useToast();
  const [latestResult, setLatestResult] = useState<LotteryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [history, setHistory] = useState<SavedGame[]>([]);
  const [analysis, setAnalysis] = useState<HistoryAnalysis | null>(null);
  const isClearingRef = useRef(false);

  const fetchLatestResult = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await lotteryService.getLatestResult();
      setLatestResult(data);
    } catch (error) {
      console.error("[Lottery] Error fetching latest result:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível buscar o último resultado. Verifique sua conexão.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  const loadHistory = useCallback(async () => {
    if (isClearingRef.current) return;
    try {
      if (!isSupabaseEnabled() || !supabase) {
        setHistory([]);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setHistory([]);
        return;
      }
      // Ensure we only load the history for the CURRENT logged-in user
      const data = await historyService.fetchHistory(session.user.id);
      setHistory(data);
    } catch (error) {
      console.error("Error loading history:", error);
      setHistory([]);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    if (isClearingRef.current) return;
    isClearingRef.current = true;
    const previousHistory = [...history];
    setHistory([]);

    try {
      let userId: string | null = null;
      if (isSupabaseEnabled() && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      }
      await historyService.clearHistory(userId);
      toast({
        title: "Histórico limpo",
        description: "Todos os seus jogos foram removidos.",
      });
      window.dispatchEvent(new CustomEvent('lottery-history-updated', { detail: { action: 'clear' } }));
    } catch (error) {
      console.error("[useLottery] Erro ao limpar histórico:", error);
      setHistory(previousHistory);
      toast({
        title: "Erro ao limpar",
        description: "Não foi possível remover o histórico. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => { isClearingRef.current = false; }, 1000);
    }
  }, [toast, history]);

  const isGameDuplicate = useCallback((numbers: number[]) => {
    const signature = [...numbers].sort((a, b) => a - b).join(',');
    return history.some(saved =>
      [...saved.numbers].sort((a, b) => a - b).join(',') === signature
    );
  }, [history]);

  const saveToHistory = async (newGames: SavedGame[]) => {
    try {
      if (!newGames || newGames.length === 0) return { success: false, duplicate: false };

      const nonDuplicateNewGames = newGames.filter(newGame => {
        const signature = [...newGame.numbers].sort((a, b) => a - b).join(',');
        return !history.some(saved =>
          [...saved.numbers].sort((a, b) => a - b).join(',') === signature
        );
      });

      if (nonDuplicateNewGames.length === 0) return { success: false, duplicate: true };

      const securedGames: SavedGame[] = nonDuplicateNewGames.map(game => ({
        ...game,
        id: game.id || generateSecureId(),
        timestamp: game.timestamp || Date.now(),
      }));

      let userId: string | null = null;
      if (isSupabaseEnabled() && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      }
      if (!userId) throw new Error('Sessão expirada. Faça login novamente.');

      const updatedHistory = await historyService.saveGames(userId, securedGames);
      setHistory(updatedHistory);
      trackCustom('SalvarJogo', {
        content_category: 'history',
        content_ids: securedGames.map(g => g.id),
        num_items: securedGames.length,
        value: securedGames.length * 3.5,
        currency: 'BRL',
      });
      window.dispatchEvent(new CustomEvent('lottery-history-updated'));
      return { success: true, duplicate: false };
    } catch (error) {
      console.error("[Lottery] Error saving history:", error);
      toast({
        title: "Erro na persistência",
        description: "Não foi possível sincronizar o histórico.",
        variant: "destructive",
      });
      return { success: false, duplicate: false };
    }
  };

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

  useEffect(() => {
    let isMounted = true;
    let channel: RealtimeChannel | undefined;

    const init = async () => {
      await fetchLatestResult();
      if (!isMounted || isClearingRef.current) return;
      await loadHistory();

      // Carrega a análise de histórico (frequência/atraso) para o gerador
      // e os painéis de tendências. Falha silenciosa mantém o modo heurístico.
      lotteryService
        .getHistoryAnalysis()
        .then((a) => { if (isMounted && a) setAnalysis(a); })
        .catch(() => { /* mantém modo heurístico */ });

      // Only open a Realtime channel scoped to the current user's rows.
      if (!isSupabaseEnabled() || !supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId || !isMounted) return;

      channel = supabase
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
            if (!isClearingRef.current) loadHistory();
          },
        )
        .subscribe();
    };
    init();

    const handleHistoryUpdate = (e?: Event) => {
      const detail = (e as CustomEvent<{ action?: string }> | undefined)?.detail;
      if (detail?.action === 'clear') { setHistory([]); return; }
      if (!isClearingRef.current) loadHistory();
    };
    window.addEventListener('lottery-history-updated', handleHistoryUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('lottery-history-updated', handleHistoryUpdate);
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [fetchLatestResult, loadHistory]);

  return {
    latestResult,
    isLoading,
    isRefreshing,
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
