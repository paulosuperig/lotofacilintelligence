import { useQuery } from '@tanstack/react-query';
import { lotteryService } from '@/services/lotteryService';
import type { HistoryAnalysis } from '@/lib/lottery/analysis';
import { historyAnalysisKey } from './useLottery';

/**
 * Expõe a análise estatística do histórico (frequência, atraso, quentes/frias
 * e atrasadas) para componentes de UI. Compartilha a mesma entrada de cache do
 * TanStack Query usada pelo `useLottery` — múltiplos consumidores, uma request.
 */
export const useLotteryStats = () => {
  const { data, isLoading } = useQuery<HistoryAnalysis | null>({
    queryKey: historyAnalysisKey,
    queryFn: () => lotteryService.getHistoryAnalysis(),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  return { analysis: data ?? null, isLoading };
};
