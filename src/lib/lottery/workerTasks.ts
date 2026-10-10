import { generateBatch, generateOptimizedGame, type BatchOptions, type GenerateOptions, type GeneratedGame } from './generator';
import { runBacktest, type BacktestOptions, type BacktestReport } from './backtest';

export type LotteryTask =
  | { kind: 'game'; options: Omit<GenerateOptions, 'rng'> }
  | { kind: 'batch'; options: Omit<BatchOptions, 'rng'> }
  | { kind: 'backtest'; draws: number[][]; options: Omit<BacktestOptions, 'rng'> };

export type LotteryTaskResult = GeneratedGame | GeneratedGame[] | BacktestReport;
export type LotteryWorkerResponse =
  | { success: true; result: LotteryTaskResult }
  | { success: false; error: string };

/** Identical algorithms in both execution contexts; no reduced candidate counts. */
export function executeLotteryTask(task: LotteryTask): LotteryTaskResult {
  switch (task.kind) {
    case 'game': return generateOptimizedGame(task.options);
    case 'batch': return generateBatch(task.options);
    case 'backtest': return runBacktest(task.draws, task.options);
  }
}