import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../use-toast';
import { LotteryResult } from '@/types/lottery';
import { lotteryService } from '@/services/lotteryService';
import { latestResultKey, historyAnalysisKey } from '@/lib/lottery/queryKeys';
import { type HistoryAnalysis } from '@/lib/lottery/analysis';

export const useLotteryLatest = (loadAnalysis = true) => {
  const { toast } = useToast();

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

  return {
    latestResult: latestResultQuery.data ?? null,
    analysis: analysisQuery.data ?? null,
    isLoading: latestResultQuery.isLoading,
    isRefreshing: latestResultQuery.isFetching,
    fetchLatestResult: () => latestResultQuery.refetch(),
  };
};
