import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequestCache } from './requestCache';

afterEach(() => vi.useRealTimers());
describe('session request cache', () => {
  it('coalesces simultaneous requests and reuses the resolved value', async () => {
    const load = vi.fn(async () => [1, 2, 3]);
    const read = createRequestCache(30_000, load);
    const [first, second] = await Promise.all([read(), read()]);
    expect(first).toEqual([1, 2, 3]);
    expect(second).toBe(first);
    expect(await read()).toBe(first);
    expect(load).toHaveBeenCalledTimes(1);
  });
  it('refreshes once at expiration', async () => {
    vi.useFakeTimers();
    const load = vi.fn().mockResolvedValueOnce('old').mockResolvedValueOnce('new');
    const read = createRequestCache(30_000, load);
    expect(await read()).toBe('old');
    vi.advanceTimersByTime(30_000);
    expect(await read()).toBe('new');
    expect(load).toHaveBeenCalledTimes(2);
  });
  it('does not cache failures or keep a rejected request alive', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce('recovered');
    const read = createRequestCache(30_000, load);
    await expect(read()).rejects.toThrow('offline');
    expect(await read()).toBe('recovered');
    expect(load).toHaveBeenCalledTimes(2);
  });
});