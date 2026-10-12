import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithRetry } from './fetchWithRetry';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('official API transport compatibility', () => {
  it('retains two retries with 400 and 800 ms backoff', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockResolvedValueOnce(new Response('', { status: 500 })).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(new Response('ok'));
    vi.stubGlobal('fetch', fetch);
    const request = fetchWithRetry('https://example.test/result');
    await vi.advanceTimersByTimeAsync(399); expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1); expect(fetch).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(799); expect(fetch).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(await (await request).text()).toBe('ok');
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('retains the default eight second abort and propagates the final failure', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    })));
    const request = fetchWithRetry('https://example.test/result', { retries: 0 });
    const rejected = expect(request).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(8000); await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });
});