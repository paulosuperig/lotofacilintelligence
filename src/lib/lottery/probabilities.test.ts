import { describe, it, expect } from 'vitest';
import {
  binomial,
  TOTAL_COMBINATIONS,
  oddsForHits,
  PRIZE_ODDS,
  formatOneIn,
  oddsFor15WithGames,
} from './probabilities';

describe('binomial', () => {
  it('computes known coefficients', () => {
    expect(binomial(25, 15)).toBe(3_268_760);
    expect(binomial(5, 0)).toBe(1);
    expect(binomial(5, 5)).toBe(1);
    expect(binomial(10, 3)).toBe(120);
    expect(binomial(3, 5)).toBe(0);
  });
});

describe('oddsForHits — valores oficiais da Caixa', () => {
  // Referência oficial Caixa (arredondada): 15→3.268.760, 14→21.791,
  // 13→692, 12→60, 11→11.
  const cases: Array<[number, number]> = [
    [15, 3_268_760],
    [14, 21_792], // 3.268.760 / 150
    [13, 692],
    [12, 60],
    [11, 11],
  ];

  it.each(cases)('acertar %i dezenas ≈ 1 em %i', (hits, oneIn) => {
    const o = oddsForHits(hits);
    expect(o.oneIn).toBe(oneIn);
  });

  it('total combinations matches C(25,15)', () => {
    expect(TOTAL_COMBINATIONS).toBe(3_268_760);
  });

  it('probabilities of all hit-counts sum to 1', () => {
    let sum = 0;
    for (let k = 0; k <= 15; k++) sum += oddsForHits(k).probability;
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe('PRIZE_ODDS', () => {
  it('covers tiers 15..11 in descending order', () => {
    expect(PRIZE_ODDS.map((o) => o.hits)).toEqual([15, 14, 13, 12, 11]);
  });
});

describe('formatOneIn', () => {
  it('formats with pt-BR thousands separator', () => {
    expect(formatOneIn(3_268_760)).toBe('1 em 3.268.760');
    expect(formatOneIn(Infinity)).toBe('—');
  });
});

describe('oddsFor15WithGames', () => {
  it('scales probability by number of games', () => {
    expect(oddsFor15WithGames(1).oneIn).toBe(3_268_760);
    expect(oddsFor15WithGames(10).oneIn).toBe(326_876);
    expect(oddsFor15WithGames(0).oneIn).toBe(Infinity);
  });
});
