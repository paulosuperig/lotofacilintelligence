import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { getLatestResult } from '@/services/lotteryApi';
import { historyService } from '@/services/historyService';
import { LotteryResult, SavedGame } from '@/types/lottery';
import { generateSecureId } from '@/lib/security/utils';
import { supabase, isSupabaseEnabled } from '@/integrations/supabase/client';
import { secureStorage } from '@/lib/security/secureStorage';
import { SavedGameSchema } from '@/lib/security/schemas';

const ITEMS_PER_PAGE = 30;

export const useLottery = () => {
  const { toast } = useToast();
  const [latestResult, setLatestResult] = useState<LotteryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [history, setHistory] = useState<SavedGame[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchLatestResult = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await getLatestResult();
      setLatestResult(data);
      localStorage.setItem('latest_lottery_result', JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching latest result:", error);
      const cached = localStorage.getItem('latest_lottery_result');
      if (cached) {
        try {
          setLatestResult(JSON.parse(cached));
        } catch (e) {
          console.error("Error parsing cached result", e);
        }
      }
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

  const syncOfflineHistory = useCallback(async (userId: string) => {
    try {
      const localHistory = secureStorage.getItem<SavedGame[]>('lottery_history') || [];
      if (localHistory.length === 0) return;

      const cloudIds = await historyService.getOfflineSyncInfo(userId);
      const toSync = localHistory.filter(g => !cloudIds.has(g.id));

      if (toSync.length > 0) {
        await historyService.saveGames(userId, toSync);
      }
    } catch (error) {
      console.error("Error syncing history:", error);
    }
  }, []);

  const loadHistory = useCallback(async (isLoadMore = false) => {
    try {
      const currentPage = isLoadMore ? page + 1 : 0;
      
      if (isSupabaseEnabled()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (!isLoadMore) await syncOfflineHistory(user.id);

          const formattedHistory = await historyService.fetchHistory(user.id, currentPage, ITEMS_PER_PAGE);
          
          setHistory(prev => isLoadMore ? [...prev, ...formattedHistory] : formattedHistory);
          setHasMore(formattedHistory.length === ITEMS_PER_PAGE);
          if (isLoadMore) setPage(currentPage);
          
          if (!isLoadMore) {
            secureStorage.setItem('lottery_history', formattedHistory);
          }
          return;
        }
      }

      // Fallback to local storage
      const saved = secureStorage.getItem<SavedGame[]>('lottery_history');
      if (saved && Array.isArray(saved)) {
        const sanitized: SavedGame[] = [];
        for (const g of saved) {
          try {
            const coerced = {
              ...g,
              numbers: Array.isArray(g?.numbers)
                ? g.numbers.map((n: any) => typeof n === 'string' ? parseInt(n, 10) : n)
                : g?.numbers,
              id: g?.id || generateSecureId(),
              timestamp: g?.timestamp || Date.now(),
            };
            const validated = SavedGameSchema.parse(coerced);
            sanitized.push(validated as SavedGame);
          } catch (e) {
            console.warn("[Security] Skipping invalid history entry:", e);
          }
        }
        const filtered = sanitized.sort((a, b) => b.timestamp - a.timestamp);
        const paginated = isLoadMore 
          ? filtered.slice(0, (currentPage + 1) * ITEMS_PER_PAGE)
          : filtered.slice(0, ITEMS_PER_PAGE);
          
        setHistory(paginated);
        setHasMore(filtered.length > paginated.length);
        if (isLoadMore) setPage(currentPage);
      } else {
        setHistory([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading history:", error);
      setHistory([]);
    }
  }, [syncOfflineHistory, page]);

  const clearHistory = async () => {
    try {
      if (isSupabaseEnabled()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await historyService.deleteHistory(user.id);
        }
      }
      secureStorage.removeItem('lottery_history');
      setHistory([]);
      setHasMore(false);
      setPage(0);
      window.dispatchEvent(new CustomEvent('lottery-history-updated'));
      toast({ title: "Histórico limpo", description: "Todos os seus jogos salvos foram removidos." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível limpar o histórico.", variant: "destructive" });
    }
  };

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
      
      if (nonDuplicateNewGames.length === 0) return { success: false, duplicate: true };
      
      const securedGames: SavedGame[] = nonDuplicateNewGames.map(game => ({
        ...game,
        id: game.id || generateSecureId(),
        timestamp: game.timestamp || Date.now()
      }));
      
      const updatedHistory = [...securedGames, ...existingHistory].sort((a, b) => b.timestamp - a.timestamp);
      
      if (isSupabaseEnabled()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await historyService.saveGames(user.id, securedGames);
        }
      }
      
      secureStorage.setItem('lottery_history', updatedHistory);
      setHistory(updatedHistory);
      window.dispatchEvent(new CustomEvent('lottery-history-updated'));
      return { success: true, duplicate: false };
    } catch (error) {
      console.error("Error during history persistence:", error);
      toast({ title: "Erro na persistência", description: "Não foi possível sincronizar o histórico.", variant: "destructive" });
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
    
    while (!valid && attempts < 300) {
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
      if (attempts < 150) {
        if (checkParity && checkPrimes && checkSum && checkMold) {
          finalGame = sorted;
          valid = true;
        }
      } else {
        if ((checkParity && checkSum) || attempts > 250) {
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
    fetchLatestResult();
    loadHistory(false);
    
    const handleHistoryUpdate = () => loadHistory(false);
    window.addEventListener('lottery-history-updated', handleHistoryUpdate);
    window.addEventListener('storage', handleHistoryUpdate);
    
    let channel: any;
    if (isSupabaseEnabled()) {
      channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'games_history' 
        }, () => loadHistory(false))
        .subscribe();
    }
    
    return () => {
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
    hasMore,
    fetchLatestResult,
    clearHistory,
    loadHistory,
    loadMore: () => loadHistory(true),
    saveToHistory,
    generateSmartGame,
    isGameDuplicate
  };
};
