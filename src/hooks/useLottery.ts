import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';
import { LotteryResult, SavedGame } from '@/types/lottery';
import { generateSecureId } from '@/lib/security/utils';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { lotteryService } from '@/services/lotteryService';
import { historyService } from '@/services/historyService';
import { trackCustom } from '@/lib/analytics/metaPixel';

export const useLottery = () => {
  const { toast } = useToast();
  const [latestResult, setLatestResult] = useState<LotteryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [history, setHistory] = useState<SavedGame[]>([]);
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

  const generateSmartGame = useCallback(() => {
    const pool = Array.from({ length: 25 }, (_, i) => i + 1);
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
    const moldNumbers = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
    const historySignatures = new Set(history.map(g => [...g.numbers].sort((a, b) => a - b).join(',')));

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

      const evenCount = sorted.filter(n => n % 2 === 0).length;
      const sum = sorted.reduce((a, b) => a + b, 0);
      const pCount = sorted.filter(n => primes.includes(n)).length;
      const moldCount = sorted.filter(n => moldNumbers.includes(n)).length;

      const checkParity = (evenCount >= 7 && evenCount <= 8);
      const checkPrimes = (pCount >= 5 && pCount <= 6);
      const checkMold = (moldCount >= 9 && moldCount <= 11);
      const checkSum = (sum >= 170 && sum <= 220);

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

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | undefined;

    const init = async () => {
      await fetchLatestResult();
      if (!isMounted || isClearingRef.current) return;
      await loadHistory();

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
      if ((e as CustomEvent)?.detail?.action === "clear") { setHistory([]); return; }
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
    fetchLatestResult,
    clearHistory,
    loadHistory,
    saveToHistory,
    generateSmartGame,
    isGameDuplicate,
  };
};
