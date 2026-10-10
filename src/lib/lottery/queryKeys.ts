export const historyKey = (userId: string | null) => ['games_history', userId] as const;
export const latestResultKey = ['latest_result'] as const;
export const historyAnalysisKey = ['history_analysis'] as const;