import { useLotteryLatest } from './lottery/useLotteryLatest';
import { useLotteryHistory } from './lottery/useLotteryHistory';
import { useLotteryGeneration } from './lottery/useLotteryGeneration';
import type { LotteryHookOptions } from './lottery/types';

export { historyKey, latestResultKey, historyAnalysisKey } from '@/lib/lottery/queryKeys';
export type { SmartFilters, SmartOptions, LotteryHookOptions } from './lottery/types';

export const useLottery = (options: LotteryHookOptions = {}) => {
  const { realtime = false, analysis: loadAnalysis = true } = options;

  const {
    latestResult,
    analysis,
    isLoading: isLatestLoading,
    isRefreshing,
    fetchLatestResult,
  } = useLotteryLatest(loadAnalysis);

  const {
    history,
    isLoading: isHistoryLoading,
    saveToHistory,
    clearHistory,
    loadHistory,
    isGameDuplicate,
  } = useLotteryHistory(realtime);

  const {
    generateSmartGame,
    generateSmartBatch,
  } = useLotteryGeneration(history, latestResult, analysis);

  return {
    latestResult,
    isLoading: isLatestLoading || isHistoryLoading,
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
