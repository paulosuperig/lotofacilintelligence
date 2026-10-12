import type { LotteryTask, LotteryTaskResult, LotteryWorkerResponse } from './workerTasks';
import type { GeneratedGame } from './generator';
import type { BacktestReport } from './backtest';

let persistentWorker: Worker | null = null;
const taskQueue: { 
  task: LotteryTask; 
  resolve: (res: any) => void; 
  reject: (err: any) => void; 
  signal?: AbortSignal;
  timer: ReturnType<typeof setTimeout>;
}[] = [];

function getWorker() {
  if (typeof Worker === 'undefined') return null;
  if (!persistentWorker) {
    persistentWorker = new Worker(new URL('./lottery.worker.ts', import.meta.url), { type: 'module' });
    persistentWorker.onmessage = (event: MessageEvent<LotteryWorkerResponse>) => {
      const current = taskQueue.shift();
      if (!current) return;
      
      clearTimeout(current.timer);
      if ('error' in event.data) current.reject(new Error(event.data.error));
      else current.resolve(event.data.result);
      
      processQueue();
    };
    persistentWorker.onerror = () => {
      const current = taskQueue.shift();
      if (current) {
        clearTimeout(current.timer);
        current.reject(new Error('Não foi possível calcular o jogo. Tente novamente.'));
      }
      persistentWorker?.terminate();
      persistentWorker = null;
      processQueue();
    };
  }
  return persistentWorker;
}

function processQueue() {
  const worker = getWorker();
  if (!worker || taskQueue.length === 0) return;
  
  // Note: This implementation is sequential to keep it simple and safe.
  // For true parallelism, a worker pool would be better.
  const next = taskQueue[0];
  worker.postMessage(next.task);
}

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
    const timer = setTimeout(() => {
      const idx = taskQueue.findIndex(q => q.timer === timer);
      if (idx !== -1) {
        taskQueue.splice(idx, 1);
        reject(new Error('O cálculo demorou demais. Tente novamente.'));
      }
    }, 60_000);

    const abort = () => {
      const idx = taskQueue.findIndex(q => q.timer === timer);
      if (idx !== -1) {
        taskQueue.splice(idx, 1);
        reject(new DOMException('Cálculo cancelado.', 'AbortError'));
      }
    };
    signal?.addEventListener('abort', abort, { once: true });

    taskQueue.push({ task, resolve, reject, signal, timer });
    if (taskQueue.length === 1) processQueue();
  });
}
