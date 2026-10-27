import { TOTAL_NUMBERS } from '../constants';
import type { HistoryAnalysis } from '../analysis';
import type { Rng } from './rng';
import type { GenStrategy } from './types';
import { STRATEGY } from './strategy';

/**
 * Peso de cada dezena para a amostragem. Combina:
 *  - base uniforme (garante que toda dezena é sorteável),
 *  - frequência histórica (dezenas mais recorrentes ganham leve vantagem),
 *  - atraso (dezenas muito atrasadas ganham leve vantagem — equilíbrio).
 * Sem histórico, todas as dezenas têm peso 1 (uniforme).
 */
export const buildWeights = (
  analysis?: HistoryAnalysis | null,
  strategy: GenStrategy = 'equilibrada'
): number[] => {
  const weights = new Array(TOTAL_NUMBERS + 1).fill(1); // índice 0 não usado
  if (!analysis || analysis.totalConcursos === 0) return weights;

  const cfg = STRATEGY[strategy];
  const stats = analysis.ranking;
  const maxFreq = Math.max(...stats.map((s) => s.frequencia), 1);
  const maxAtraso = Math.max(...stats.map((s) => s.atraso), 1);

  for (const s of stats) {
    // frequência normalizada (0..1) e atraso normalizado (0..1)
    const fNorm = s.frequencia / maxFreq;
    const aNorm = s.atraso / maxAtraso;
    // base 1 + pesos da estratégia => enviesa quentes/atrasadas sem zerar ninguém
    weights[s.numero] = 1 + cfg.freqW * fNorm + cfg.atrasoW * aNorm;
  }
  return weights;
};

/** Amostragem ponderada SEM reposição de `count` dezenas do pool informado. */
export const weightedSample = (
  pool: number[],
  weights: number[],
  count: number,
  rng: Rng
): number[] => {
  const chosen: number[] = [];
  const available = [...pool];
  const w = available.map((n) => Math.max(weights[n] ?? 1, 1e-6));

  for (let k = 0; k < count && available.length > 0; k++) {
    const total = w.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    let idx = 0;
    while (idx < w.length - 1 && r >= w[idx]) {
      r -= w[idx];
      idx++;
    }
    chosen.push(available[idx]);
    available.splice(idx, 1);
    w.splice(idx, 1);
  }
  return chosen;
};
