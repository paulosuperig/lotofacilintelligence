import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { sessionKey } from '../useAuth';
import { historyKey } from '@/lib/lottery/queryKeys';
import { useLotteryHistory } from './useLotteryHistory';

afterEach(() => vi.unstubAllGlobals());

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(sessionKey, { user: { id: 'user-id' } });
  client.setQueryData(historyKey('user-id'), [{ id: 'old-id', numbers: [1, 2, 3], timestamp: 1 }]);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, ...renderHook(() => useLotteryHistory(false), { wrapper }) };
}

describe('history hook public contract', () => {
  it('rejects an existing combination regardless of number order without a request', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { result, client, unmount } = setup();
    let saved;
    await act(async () => { saved = await result.current.saveToHistory([{ id: 'new-id', numbers: [3, 1, 2], timestamp: 2 }]); });
    expect(saved).toEqual({ success: false, duplicate: true, savedCount: 0 });
    expect(fetch).not.toHaveBeenCalled();
    unmount(); client.clear();
  });
  it('adds only the acknowledged row with its server ID to the cache', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([{
      id: 'server-id', numbers: [4, 5, 6], created_at: '2026-10-10T18:00:00Z',
      sum_value: 15, model_name: null, type: 'Gerador Equilibrada',
    }]), { status: 201, headers: { 'Content-Type': 'application/json' } })));
    const { result, client, unmount } = setup();
    let saved;
    await act(async () => { saved = await result.current.saveToHistory([{ id: 'temporary-id', numbers: [4, 5, 6], timestamp: 2 }]); });
    expect(saved).toEqual({ success: true, duplicate: false, savedCount: 1 });
    expect(result.current.history.map((game) => game.id)).toEqual(['server-id', 'old-id']);
    unmount(); client.clear();
  });
  it('does not mark a failed insert as saved or change cached history', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'permission denied', code: '42501' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })));
    const { result, client, unmount } = setup();
    let saved;
    await act(async () => { saved = await result.current.saveToHistory([{ id: 'new-id', numbers: [4, 5, 6], timestamp: 2 }]); });
    expect(saved).toEqual({ success: false, duplicate: false, savedCount: 0 });
    expect(result.current.history.map((game) => game.id)).toEqual(['old-id']);
    unmount(); client.clear();
  });
});