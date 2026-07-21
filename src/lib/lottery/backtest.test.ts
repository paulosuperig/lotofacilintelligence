import { describe, it, expect } from 'vitest';
import { runBacktest, formatBacktestReport } from './backtest';
import { seededRng } from './generator';
import type { DrawNumbers } from './analysis';

/** Gera um conjunto sintético de concursos uniformes e reprodutíveis. */
const syntheticDraws = (n: number, seed = 1): DrawNumbers[] => {
  const rng = seededRng(seed);
  const draws: DrawNumbers[] = [];
  for (let d = 0; d < n; d++) {
    const pool = Array.from({ length: 25 }, (_, i) => i + 1);
    for (let i = 0; i < 15; i++) {
      const j = i + Math.floor(rng() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    draws.push(pool.slice(0, 15).sort((a, b) => a - b));
  }
  return draws;
};

describe('runBacktest', () => {
  const draws = syntheticDraws(200, 7);

  it('produces coherent aggregates for both strategies', () => {
    const report = runBacktest(draws, {
      gamesPerDraw: 2,
      minHistory: 50,
      window: 80,
      candidates: 20,
      maxDraws: 60,
      rng: seededRng(999),
    });

    expect(report.sampleConcursos).toBeGreaterThan(0);
    expect(report.smart.totalGames).toBe(report.smart.totalConcursos * 2);
    expect(report.random.totalGames).toBe(report.random.totalConcursos * 2);

    // Média de acertos deve gravitar em torno do esperado teórico (9)
    // para AMBAS as estratégias, pois o sorteio é uniforme.
    expect(report.smart.avgHits).toBeGreaterThan(7);
    expect(report.smart.avgHits).toBeLessThan(11);
    expect(report.random.avgHits).toBeGreaterThan(7);
    expect(report.random.avgHits).toBeLessThan(11);
  });

  it('never reports impossible hit counts', () => {
    const report = runBacktest(draws, { gamesPerDraw: 1, maxDraws: 40, candidates: 15 });
    for (let h = 0; h <= 15; h++) {
      expect(report.smart.distribution[h]).toBeGreaterThanOrEqual(0);
    }
    expect(report.smart.bestHits).toBeLessThanOrEqual(15);
  });

  it('formats a markdown report', () => {
    const report = runBacktest(draws, { gamesPerDraw: 1, maxDraws: 30, candidates: 15 });
    const md = formatBacktestReport(report);
    expect(md).toContain('Backtest');
    expect(md).toContain('Gerador inteligente');
    expect(md).toContain('Aleatório puro');
  });

  it('handles insufficient history gracefully', () => {
    const report = runBacktest(syntheticDraws(30, 3), { minHistory: 100 });
    expect(report.sampleConcursos).toBe(0);
    expect(report.smart.avgHits).toBe(0);
  });
});
