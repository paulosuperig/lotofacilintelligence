import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzeHistory } from './analysis';
import { buildPool } from './buildPool';

afterEach(() => vi.unstubAllGlobals());
describe('wheel pool composition compatibility', () => {
  it('prioritizes hot numbers, delayed numbers, then ranking without mutating analysis', () => {
    const analysis = analyzeHistory([Array.from({ length: 15 }, (_, i) => i + 1)]);
    analysis.quentes = [5, 3]; analysis.atrasadas = [3, 25, 20];
    const before = structuredClone(analysis);
    expect(buildPool(4, analysis)).toEqual([3, 5, 20, 25]);
    expect(analysis).toEqual(before);
  });
  it('retains modulo-based cryptographic fallback and sorted unique output', () => {
    let value = 0;
    vi.stubGlobal('crypto', { getRandomValues: (buffer: Uint32Array) => { buffer[0] = value++; return buffer; } });
    expect(buildPool(5, null)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPool(0, null)).toEqual([]);
  });
});