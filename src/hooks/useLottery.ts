import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { getLatestResult } from '@/services/lotteryApi';
import { LotteryResult, SavedGame } from '@/types/lottery';
import { supabase } from '@/integrations/supabase/client';

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
      // Salvar no cache local para carregamento instantâneo no futuro
      localStorage.setItem('latest_lottery_result', JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching latest result:", error);
      // Tentar carregar do cache se a API falhar
      const cached = localStorage.getItem('latest_lottery_result');
      if (cached) {
        setLatestResult(JSON.parse(cached));
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

  const loadHistory = async () => {
    // Preparação para Supabase:
    // const { data, error } = await supabase.from('games_history').select('*').order('created_at', { ascending: false });
    
    const saved = localStorage.getItem('lottery_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        setHistory(parsed.filter((g: any) => g.timestamp > sevenDaysAgo).slice(0, 50));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const clearHistory = async () => {
    // Preparação para Supabase:
    // await supabase.from('games_history').delete().match({ user_id: currentUserId });

    localStorage.removeItem('lottery_history');
    setHistory([]);
    toast({
      title: "Histórico limpo",
      description: "Todos os seus jogos salvos foram removidos com sucesso.",
    });
  };

  const saveToHistory = async (newGames: SavedGame[]) => {
    // Preparação para Supabase:
    // await supabase.from('games_history').insert(newGames.map(g => ({ ...g, user_id: userId })));

    const existingHistory = JSON.parse(localStorage.getItem('lottery_history') || '[]');
    const updatedHistory = [...newGames, ...existingHistory].slice(0, 100);
    localStorage.setItem('lottery_history', JSON.stringify(updatedHistory));
    setHistory(updatedHistory);
  };

  useEffect(() => {
    fetchLatestResult();
    loadHistory();
  }, []);

  return {
    latestResult,
    isLoading,
    isRefreshing,
    history,
    fetchLatestResult,
    clearHistory,
    loadHistory,
    saveToHistory
  };
};
