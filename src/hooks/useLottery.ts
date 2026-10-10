import { useLotteryLatest } from './lottery/useLotteryLatest';
import { useLotteryHistory } from './lottery/useLotteryHistory';
import { useLotteryGeneration } from './lottery/useLotteryGeneration';

export { historyKey, latestResultKey, historyAnalysisKey } from '@/lib/lottery/queryKeys';
export type { SmartFilters, LotteryHookOptions } from './lottery/types';

export interface LotteryHookOptions { realtime?: boolean; analysis?: boolean }

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
