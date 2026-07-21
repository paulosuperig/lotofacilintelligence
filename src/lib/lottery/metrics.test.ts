import { describe, it, expect } from 'vitest';
import { computeGameMetrics, calculateGameStats, maxConsecutive } from './metrics';

describe('metrics', () => {
  const game = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  it('computes basic metrics', () => {
    const m = computeGameMetrics(game);
    expect(m.soma).toBe(120);
    expect(m.pares).toBe(7); // 2,4,6,8,10,12,14
    expect(m.impares).toBe(8);
    expect(m.primos).toBe(6); // 2,3,5,7,11,13
    expect(m.sequencia).toBe(15);
  });

  it('computes repeated numbers vs previous draw', () => {
    const prev = [1, 2, 3, 4, 5, 20, 21, 22, 23, 24, 25, 16, 17, 18, 19];
    const m = computeGameMetrics(game, prev);
    expect(m.repetidas).toBe(5); // 1,2,3,4,5
  });

  it('returns null repeated when no previous draw', () => {
    expect(computeGameMetrics(game).repetidas).toBeNull();
  });

  it('maxConsecutive handles gaps', () => {
    expect(maxConsecutive([1, 2, 3, 10, 11, 20])).toBe(3);
    expect(maxConsecutive([2, 4, 6, 8])).toBe(1);
    expect(maxConsecutive([])).toBe(0);
  });

  it('keeps backward-compatible calculateGameStats shape', () => {
    const s = calculateGameStats(game);
    expect(s).toEqual({ pairs: 7, odd: 8, primes: 6, sum: 120, mold: expect.any(Number), sequence: 15 });
  });
});
