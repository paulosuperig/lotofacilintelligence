import { describe, it, expect } from 'vitest';
import {
  generateOptimizedGame,
  scoreGame,
  gameSignature,
  seededRng,
  buildWeights,
} from './generator';
import { analyzeHistory } from './analysis';
import { computeGameMetrics } from './metrics';
import { BANDS, NUMBERS_PER_GAME } from './constants';

const validShape = (nums: number[]) => {
  expect(nums).toHaveLength(NUMBERS_PER_GAME);
  expect(new Set(nums).size).toBe(NUMBERS_PER_GAME); // únicos
  for (const n of nums) {
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(25);
  }
  // ordenado
  expect([...nums].sort((a, b) => a - b)).toEqual(nums);
};

describe('scoreGame', () => {
  it('gives a high score to a statistically balanced game', () => {
    // jogo equilibrado real (concurso típico)
    const good = [1, 2, 4, 5, 8, 10, 11, 13, 14, 18, 20, 21, 23, 24, 25];
    const bad = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // soma 120, sequência 15
    expect(scoreGame(good)).toBeGreaterThan(scoreGame(bad));
  });
});

describe('generateOptimizedGame', () => {
  it('always returns a valid 15-number game (no history)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const g = generateOptimizedGame({ rng: seededRng(seed), candidates: 40 });
      validShape(g.numbers);
      expect(g.sum).toBe(g.numbers.reduce((a, b) => a + b, 0));
    }
  });

  it('is deterministic given the same seed', () => {
    const a = generateOptimizedGame({ rng: seededRng(123), candidates: 40 });
    const b = generateOptimizedGame({ rng: seededRng(123), candidates: 40 });
    expect(a.numbers).toEqual(b.numbers);
  });

  it('respects statistical bands on average', () => {
    // Sobre muitos jogos, a métrica principal (soma) deve ficar dentro do aceitável.
    let inBand = 0;
    const N = 60;
    for (let seed = 1; seed <= N; seed++) {
      const g = generateOptimizedGame({ rng: seededRng(seed * 7 + 1), candidates: 60 });
      const m = computeGameMetrics(g.numbers);
      if (m.soma >= BANDS.soma.min && m.soma <= BANDS.soma.max) inBand++;
    }
    // esperamos ampla maioria dentro da faixa aceitável
    expect(inBand / N).toBeGreaterThan(0.9);
  });

  it('anchors repeated numbers to the previous draw', () => {
    const previousDraw = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 2, 4];
    let totalRep = 0;
    const N = 40;
    for (let seed = 1; seed <= N; seed++) {
      const g = generateOptimizedGame({
        previousDraw,
        rng: seededRng(seed * 13 + 3),
        candidates: 50,
      });
      validShape(g.numbers);
      const rep = g.numbers.filter((n) => previousDraw.includes(n)).length;
      // dentro da faixa aceitável de repetidas
      expect(rep).toBeGreaterThanOrEqual(BANDS.repetidas.min);
      expect(rep).toBeLessThanOrEqual(BANDS.repetidas.max);
      totalRep += rep;
    }
    const avg = totalRep / N;
    // média deve gravitar em torno da faixa ideal (8..10)
    expect(avg).toBeGreaterThanOrEqual(BANDS.repetidas.idealMin - 1);
    expect(avg).toBeLessThanOrEqual(BANDS.repetidas.idealMax + 1);
  });

  it('avoids duplicated signatures when possible', () => {
    const first = generateOptimizedGame({ rng: seededRng(42), candidates: 60 });
    const avoid = new Set([gameSignature(first.numbers)]);
    const second = generateOptimizedGame({ rng: seededRng(42), candidates: 60, avoid });
    expect(gameSignature(second.numbers)).not.toBe(gameSignature(first.numbers));
  });

  it('uses history weights when analysis is provided', () => {
    const draws = Array.from({ length: 30 }, () =>
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    );
    const analysis = analyzeHistory(draws, { newestFirst: true });
    const g = generateOptimizedGame({ analysis, rng: seededRng(5), candidates: 40 });
    expect(g.dataDriven).toBe(true);
    validShape(g.numbers);
  });
});

describe('buildWeights', () => {
  it('returns uniform weights without history', () => {
    const w = buildWeights(null);
    // todos iguais a 1 (índices 1..25)
    for (let n = 1; n <= 25; n++) expect(w[n]).toBe(1);
  });

  it('gives more weight to frequent numbers', () => {
    const draws = Array.from({ length: 20 }, () =>
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    );
    const analysis = analyzeHistory(draws, { newestFirst: true });
    const w = buildWeights(analysis);
    // dezena 1 (sempre presente) deve pesar mais que dezena 25 (nunca presente)
    expect(w[1]).toBeGreaterThan(w[25]);
  });
});
