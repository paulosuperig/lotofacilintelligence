import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { getLatestResult } from '@/services/lotteryApi';
import { LotteryResult, SavedGame } from '@/types/lottery';
import { generateSecureId } from '@/lib/security/utils';

export const useLottery = () => {
  const { toast } = useToast();
  const [latestResult, setLatestResult] = useState<LotteryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [history, setHistory] = useState<SavedGame[]>([]);

  const fetchLatestResult = async () => {
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
  };

  const loadHistory = useCallback(() => {
    const saved = localStorage.getItem('lottery_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedGame[];
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const filtered = parsed
          .filter(g => g.timestamp > sevenDaysAgo)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 100);
        
        setHistory(filtered);
        
        // Update storage if we filtered old items
        if (filtered.length !== parsed.length) {
          localStorage.setItem('lottery_history', JSON.stringify(filtered));
        }
      } catch (e) {
        console.error("Error parsing history", e);
        setHistory([]);
      }
    }
  }, []);

  const clearHistory = async () => {
    try {
      localStorage.removeItem('lottery_history');
      setHistory([]);
      toast({
        title: "Histórico limpo",
        description: "Todos os seus jogos salvos foram removidos com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível limpar o histórico.",
        variant: "destructive"
      });
    }
  };

  const isGameDuplicate = (numbers: number[]) => {
    const sortedNew = [...numbers].sort((a, b) => a - b).join(',');
    return history.some(saved => 
      [...saved.numbers].sort((a, b) => a - b).join(',') === sortedNew
    );
  };

  const saveToHistory = async (newGames: SavedGame[]) => {
    try {
      const existingHistory = JSON.parse(localStorage.getItem('lottery_history') || '[]');
      
      // Filter out duplicates from the new games being added
      const nonDuplicateNewGames = newGames.filter(newGame => {
        const sortedNew = [...newGame.numbers].sort((a, b) => a - b).join(',');
        return !existingHistory.some((saved: SavedGame) => 
          [...saved.numbers].sort((a, b) => a - b).join(',') === sortedNew
        );
      });

      if (nonDuplicateNewGames.length === 0) {
        return { success: false, duplicate: true };
      }

      const updatedHistory = [...nonDuplicateNewGames, ...existingHistory]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100);
      
      localStorage.setItem('lottery_history', JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
      
      return { success: true, duplicate: false };
    } catch (error) {
      console.error("Error saving to history", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o jogo no histórico.",
        variant: "destructive"
      });
      return { success: false, duplicate: false };
    }
  };

  const generateSmartGame = useCallback(() => {
    const pool = Array.from({ length: 25 }, (_, i) => i + 1);
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
    const moldNumbers = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
    
    let attempts = 0;
    let finalGame: number[] = [];
    let valid = false;

    while (!valid && attempts < 150) {
      attempts++;
      const numbers: number[] = [];
      const localPool = [...pool];
      
      for (let i = 0; i < 15; i++) {
        const randomIndex = Math.floor(Math.random() * localPool.length);
        numbers.push(localPool.splice(randomIndex, 1)[0]);
      }
      
      const sorted = numbers.sort((a, b) => a - b);
      
      const evenCount = sorted.filter(n => n % 2 === 0).length;
      const sum = sorted.reduce((a, b) => a + b, 0);
      const pCount = sorted.filter(n => primes.includes(n)).length;
      const moldCount = sorted.filter(n => moldNumbers.includes(n)).length;

      // Lotofácil target trends:
      const checkParity = (evenCount === 7 || evenCount === 8);
      const checkPrimes = (pCount >= 5 && pCount <= 6);
      const checkMold = (moldCount >= 9 && moldCount <= 11);
      const checkSum = (sum >= 175 && sum <= 215);

      if ((checkParity && checkPrimes && checkSum && checkMold) || attempts > 100) {
        finalGame = sorted;
        valid = true;
      }
    }

    return {
      id: generateSecureId(),
      numbers: finalGame,
      timestamp: Date.now()
    };
  }, []);

  useEffect(() => {
    fetchLatestResult();
    loadHistory();
  }, [loadHistory]);

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
