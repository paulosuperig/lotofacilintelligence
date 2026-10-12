import { afterEach, describe, expect, it, vi } from 'vitest';
import { aiChatService } from './aiChatService';

afterEach(() => vi.unstubAllGlobals());
describe('chat persistence contract', () => {
  it('keeps selected fields, user filter, ascending order and limit 30', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify([{ role: 'user', content: 'teste' }]), {
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetch);
    await expect(aiChatService.fetchChat('user-a', new AbortController().signal)).resolves.toEqual([{ role: 'user', content: 'teste' }]);
    const url = new URL(String(fetch.mock.calls[0]?.[0]));
    expect(url.searchParams.get('select')).toBe('role,content');
    expect(url.searchParams.get('user_id')).toBe('eq.user-a');
    expect(url.searchParams.get('order')).toBe('created_at.asc');
    expect(url.searchParams.get('limit')).toBe('30');
  });
  it('persists the original payload and propagates insert errors', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ message: 'permission denied' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetch);
    await expect(aiChatService.persistMessage('user-a', { role: 'assistant', content: 'resposta' })).rejects.toMatchObject({ message: 'permission denied' });
    const options = fetch.mock.calls[0]?.[1] as RequestInit;
    expect(options.method).toBe('POST');
    expect(JSON.parse(String(options.body))).toEqual({ user_id: 'user-a', role: 'assistant', content: 'resposta' });
  });
  it('preserves resolved delete errors and skips signed-out requests', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ message: 'permission denied' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetch);
    await expect(aiChatService.clearChat('user-a')).resolves.toBeUndefined();
    expect((fetch.mock.calls[0]?.[1] as RequestInit).method).toBe('DELETE');
    fetch.mockClear();
    await expect(aiChatService.fetchChat(null, new AbortController().signal)).resolves.toEqual([]);
    await aiChatService.persistMessage(null, { role: 'user', content: 'teste' });
    await aiChatService.clearChat(null);
    expect(fetch).not.toHaveBeenCalled();
  });
});