import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';
import { LotteryResult, SavedGame } from '@/types/lottery';
import { generateSecureId } from '@/lib/security/utils';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { secureStorage } from '@/lib/security/secureStorage';
import { lotteryService } from '@/services/lotteryService';
import { historyService } from '@/services/historyService';

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
      secureStorage.setItem('latest_lottery_result', data);
    } catch (error) {
      console.error("[Lottery] Error fetching latest result:", error);
      const cached = secureStorage.getItem<LotteryResult>('latest_lottery_result');
      if (cached) setLatestResult(cached);
      toast({
        title: "Erro ao atualizar",
        description: "Exibindo últimos dados salvos. Verifique sua conexão.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  const loadHistory = useCallback(async () => {
    if (isClearingRef.current) return;

    try {
      if (isSupabaseEnabled() && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
          // Bloquear carregamento se houve uma limpeza recente que ainda não refletiu no server
          const lastClear = Number(localStorage.getItem('last_history_clear_at') || 0);
          await historyService.syncOffline(user.id);
          const data = await historyService.fetchHistory(user.id);
          
          // Filtrar qualquer dado que possa ter vindo do cache/realtime pós-limpeza
          const filteredData = data.filter(g => g.timestamp > lastClear);
          setHistory(filteredData);
          return;
        }
      }
      const local = historyService.getLocalHistory();
      setHistory(local.sort((a, b) => b.timestamp - a.timestamp).slice(0, 100));
    } catch (error) {
      console.error("Error loading history:", error);
      setHistory([]);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    if (isClearingRef.current) return;
    
    isClearingRef.current = true;
    const previousHistory = [...history];
    setHistory([]); // Feedback visual instantâneo
    
    try {
      let userId = null;
      if (isSupabaseEnabled() && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      }
      
      // Limpeza definitiva no serviço (local + cloud)
      await historyService.clearHistory(userId);
      
      toast({
        title: "Histórico limpo",
        description: "Todos os seus jogos salvos foram removidos de forma definitiva.",
      });
      
      // Notificar outros componentes/tabs
      window.dispatchEvent(new CustomEvent('lottery-history-updated', { detail: { action: 'clear' } }));
    } catch (error) {
      console.error("[useLottery] Erro ao limpar histórico:", error);
      setHistory(previousHistory); // Reverter em caso de erro crítico
      toast({
        title: "Erro ao limpar",
        description: "Não foi possível remover o histórico cloud. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      // Pequeno delay para garantir que eventos de rede/realtime sejam ignorados
      setTimeout(() => {
        isClearingRef.current = false;
      }, 1500);
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

      const existingHistory = secureStorage.getItem<SavedGame[]>('lottery_history') || [];
      const nonDuplicateNewGames = newGames.filter(newGame => {
        const signature = [...newGame.numbers].sort((a, b) => a - b).join(',');
        return !existingHistory.some((saved: SavedGame) => 
          [...saved.numbers].sort((a, b) => a - b).join(',') === signature
        );
      });

      if (nonDuplicateNewGames.length === 0) {
        return { success: false, duplicate: true };
      }

      const securedGames: SavedGame[] = nonDuplicateNewGames.map(game => ({
        ...game,
        id: game.id || generateSecureId(),
        timestamp: game.timestamp || Date.now()
      }));

      let userId = null;
      if (isSupabaseEnabled() && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      }

      const updatedHistory = await historyService.saveGames(userId, securedGames);
      setHistory(updatedHistory);
      window.dispatchEvent(new CustomEvent('lottery-history-updated'));
      
      return { success: true, duplicate: false };
    } catch (error) {
      console.error("[Lottery] Error saving history:", error);
      toast({
        title: "Erro na persistência",
        description: "Não foi possível sincronizar o histórico.",
        variant: "destructive"
      });
      return { success: false, duplicate: false };
    }
  };

  /**
   * Skill: @skillslovable - Performance & Algorithmic Excellence
   * Gerador inteligente com filtragem estatística avançada e segurança criptográfica.
   */
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

      // Filtros baseados em tendências reais da Lotofácil (Skills 4, 18)
      const checkParity = (evenCount >= 7 && evenCount <= 8);
      const checkPrimes = (pCount >= 5 && pCount <= 6);
      const checkMold = (moldCount >= 9 && moldCount <= 11);
      const checkSum = (sum >= 170 && sum <= 220);

      if (attempts < 250) {
        if (checkParity && checkPrimes && checkSum && checkMold) {
          finalGame = sorted;
          valid = true;
        }
      } else {
        // Relaxamento gradual para garantir performance sem travar a UI (Skill 36)
        if ((checkParity && checkSum) || attempts > 450) {
          finalGame = sorted;
          valid = true;
        }
      }
    }

    return {
      id: generateSecureId(),
      numbers: finalGame,
      timestamp: Date.now(),
      sum: finalGame.reduce((a, b) => a + b, 0),
      type: 'Gerador Inteligente'
    };
  }, [history]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await fetchLatestResult();
      if (isMounted && !isClearingRef.current) await loadHistory();
    };
    init();
    
    const handleHistoryUpdate = (e?: any) => {
      // Se for um evento de limpeza, garantimos o estado vazio
      if (e?.detail?.action === 'clear') {
        setHistory([]);
        return;
      }
      if (!isClearingRef.current) loadHistory();
    };

    window.addEventListener('lottery-history-updated', handleHistoryUpdate);
    window.addEventListener('storage', handleHistoryUpdate);

    let channel: any;
    if (isSupabaseEnabled() && supabase) {
      channel = supabase
        .channel(`games-history-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'games_history' }, (payload) => {
          // Só recarrega se não estivermos no meio de uma limpeza
          if (!isClearingRef.current) {
            loadHistory();
          }
        })
        .subscribe();
    }
    
    return () => {
      isMounted = false;
      window.removeEventListener('lottery-history-updated', handleHistoryUpdate);
      window.removeEventListener('storage', handleHistoryUpdate);
      if (channel) supabase.removeChannel(channel);
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
    isGameDuplicate
  };
};
