import { executeLotteryTask, type LotteryTask, type LotteryWorkerResponse } from './workerTasks';

self.onmessage = (event: MessageEvent<LotteryTask>) => {
  let response: LotteryWorkerResponse;
  try {
    response = { success: true, result: executeLotteryTask(event.data) };
  } catch (error) {
    response = { success: false, error: error instanceof Error ? error.message : 'Falha no cálculo.' };
  }
  self.postMessage(response);
};