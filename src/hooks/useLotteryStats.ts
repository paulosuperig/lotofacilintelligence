import { useEffect, useState } from 'react';
import { lotteryService } from '@/services/lotteryService';
import type { HistoryAnalysis } from '@/lib/lottery/analysis';

/**
 * Expõe a análise estatística do histórico (frequência, atraso, quentes/frias
 * e atrasadas) para componentes de UI. Usa o cache em memória do
 * `lotteryService`, então múltiplos consumidores não disparam novas requisições.
 */
export const useLotteryStats = () => {
  const [analysis, setAnalysis] = useState<HistoryAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    lotteryService
      .getHistoryAnalysis()
      .then((a) => { if (mounted) setAnalysis(a); })
      .catch(() => { /* mantém null; UI usa fallback */ })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, []);

  return { analysis, isLoading };
};
