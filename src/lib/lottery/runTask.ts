import type { LotteryTask, LotteryTaskResult, LotteryWorkerResponse } from './workerTasks';
import type { GeneratedGame } from './generator';
import type { BacktestReport } from './backtest';

export function runLotteryTask(task: Extract<LotteryTask, { kind: 'game' }>, signal?: AbortSignal): Promise<GeneratedGame>;
export function runLotteryTask(task: Extract<LotteryTask, { kind: 'batch' }>, signal?: AbortSignal): Promise<GeneratedGame[]>;
export function runLotteryTask(task: Extract<LotteryTask, { kind: 'backtest' }>, signal?: AbortSignal): Promise<BacktestReport>;
export async function runLotteryTask(task: LotteryTask, signal?: AbortSignal): Promise<LotteryTaskResult> {
  if (signal?.aborted) throw new DOMException('Cálculo cancelado.', 'AbortError');

  if (typeof Worker === 'undefined') {
    const { executeLotteryTask } = await import('./workerTasks');
    return executeLotteryTask(task);
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./lottery.worker.ts', import.meta.url), { type: 'module' });
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    };
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const abort = () => fail(new DOMException('Cálculo cancelado.', 'AbortError'));
    const timer = setTimeout(() => fail(new Error('O cálculo demorou demais. Tente novamente.')), 60_000);
    signal?.addEventListener('abort', abort, { once: true });
    worker.onmessage = (event: MessageEvent<LotteryWorkerResponse>) => {
      if (settled) return;
      if ('error' in event.data) { fail(new Error(event.data.error)); return; }
      settled = true;
      cleanup();
      resolve(event.data.result);
    };
    worker.onerror = () => fail(new Error('Não foi possível calcular o jogo. Tente novamente.'));
    if (signal?.aborted) { abort(); return; }
    try { worker.postMessage(task); } catch (error) { fail(error); }
  });
}
