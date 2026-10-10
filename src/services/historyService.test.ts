import { afterEach, describe, expect, it, vi } from 'vitest';
import { historyService } from './historyService';

afterEach(() => vi.unstubAllGlobals());
describe('history persistence acknowledgement', () => {
  it('uses database-assigned IDs and performs no second history read', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify([{
      id: 'persisted-id', numbers: [1, 2, 3], created_at: '2026-10-10T18:00:00Z',
      sum_value: 6, model_name: null, type: 'Gerador Equilibrada',
    }]), { status: 201, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetch);
    const saved = await historyService.saveGames('user-id', [{
      id: 'temporary-id', numbers: [1, 2, 3], timestamp: 1791655200000, sum: 6, type: 'Gerador Equilibrada',
    }]);
    expect(saved[0]?.id).toBe('persisted-id');
    expect(saved[0]?.timestamp).toBe(Date.parse('2026-10-10T18:00:00Z'));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('does not acknowledge failed inserts as saved', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'permission denied', code: '42501' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })));
    await expect(historyService.saveGames('user-id', [{ id: 'temporary-id', numbers: [1, 2, 3], timestamp: 1791655200000 }]))
      .rejects.toMatchObject({ message: 'permission denied' });
  });
});