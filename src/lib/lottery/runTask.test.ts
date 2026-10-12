import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runLotteryTask } from './runTask';

class TestWorker {
  static instances: TestWorker[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() { TestWorker.instances.push(this); }
  complete(result: unknown) { this.onmessage?.({ data: { success: true, result } } as MessageEvent); }
}
const task = { kind: 'game' as const, options: {} };

beforeEach(() => { TestWorker.instances = []; vi.stubGlobal('Worker', TestWorker); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('lottery task lifecycle', () => {
  it('isolates concurrent results and terminates each completed worker', async () => {
    const first = runLotteryTask(task);
    const second = runLotteryTask(task);
    expect(TestWorker.instances).toHaveLength(2);
    const [a, b] = TestWorker.instances;
    b.complete({ numbers: [2] });
    a.complete({ numbers: [1] });
    await expect(first).resolves.toEqual({ numbers: [1] });
    await expect(second).resolves.toEqual({ numbers: [2] });
    expect(a.terminate).toHaveBeenCalledOnce();
    expect(b.terminate).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('terminates an aborted calculation and leaves the other request untouched', async () => {
    const controller = new AbortController();
    const first = runLotteryTask(task, controller.signal);
    const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' });
    const second = runLotteryTask(task);
    controller.abort();
    await rejected;
    expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
    TestWorker.instances[1].complete({ numbers: [2] });
    await expect(second).resolves.toEqual({ numbers: [2] });
    expect(vi.getTimerCount()).toBe(0);
  });
  it('terminates after the existing 60 second timeout', async () => {
    const pending = runLotteryTask(task);
    const rejected = expect(pending).rejects.toThrow('O cálculo demorou demais. Tente novamente.');
    await vi.advanceTimersByTimeAsync(60_000);
    await rejected;
    expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
  });
  it('does not create a worker for an already aborted request', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(runLotteryTask(task, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(TestWorker.instances).toHaveLength(0);
  });
  it('cleans up a worker transport failure', async () => {
    const pending = runLotteryTask(task);
    const rejected = expect(pending).rejects.toThrow('Não foi possível calcular o jogo. Tente novamente.');
    TestWorker.instances[0].onerror?.();
    await rejected;
    expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});