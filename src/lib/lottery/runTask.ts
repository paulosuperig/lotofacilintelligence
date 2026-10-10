import type { LotteryTask, LotteryTaskResult, LotteryWorkerResponse } from './workerTasks';
import type { GeneratedGame } from './generator';
import type { BacktestReport } from './backtest';

export function runLotteryTask(task: Extract<LotteryTask, { kind: 'game' }>, signal?: AbortSignal): Promise<GeneratedGame>;
export function runLotteryTask(task: Extract<LotteryTask, { kind: 'batch' }>, signal?: AbortSignal): Promise<GeneratedGame[]>;
export function runLotteryTask(task: Extract<LotteryTask, { kind: 'backtest' }>, signal?: AbortSignal): Promise<BacktestReport>;
export async function runLotteryTask(task: LotteryTask, signal?: AbortSignal): Promise<LotteryTaskResult> {
  if (signal?.aborted) throw new DOMException('Cálculo cancelado.', 'AbortError');
  // Older browsers retain functionality; the normal path never blocks the UI.
  if (typeof Worker === 'undefined') {
    const { executeLotteryTask } = await import('./workerTasks');
    return executeLotteryTask(task);
  }
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./lottery.worker.ts', import.meta.url), { type: 'module' });
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      worker.terminate();
    };
    const abort = () => { cleanup(); reject(new DOMException('Cálculo cancelado.', 'AbortError')); };
    const timer = setTimeout(() => { cleanup(); reject(new Error('O cálculo demorou demais. Tente novamente.')); }, 60_000);
    signal?.addEventListener('abort', abort, { once: true });
    worker.onmessage = (event: MessageEvent<LotteryWorkerResponse>) => {
      cleanup();
      if ('error' in event.data) reject(new Error(event.data.error));
      else resolve(event.data.result);
    };
    worker.onerror = () => { cleanup(); reject(new Error('Não foi possível calcular o jogo. Tente novamente.')); };
    try { worker.postMessage(task); } catch (error) { cleanup(); reject(error); }
  });
}