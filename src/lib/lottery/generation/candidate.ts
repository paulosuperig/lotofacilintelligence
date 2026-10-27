import { TOTAL_NUMBERS, NUMBERS_PER_GAME } from '../constants';
import type { Rng } from './rng';
import type { GenStrategy } from './types';
import { repeatTargetFor } from './strategy';
import { weightedSample } from './weights';

export interface CandidateConstraints {
  fixed: number[];
  excludedSet: Set<number>;
  strategy: GenStrategy;
}

/**
 * Gera UM candidato ponderado, honrando dezenas fixas/excluídas e ancorando no
 * último concurso conforme a estratégia. Nunca inclui uma excluída nem omite
 * uma fixa; nunca fabrica repetição (só amostra do pool permitido).
 */
export const generateCandidate = (
  weights: number[],
  previousDraw: number[] | null | undefined,
  rng: Rng,
  constraints: CandidateConstraints
): number[] => {
  const { fixed, excludedSet, strategy } = constraints;
  const base = fixed.slice(0, NUMBERS_PER_GAME);
  const baseSet = new Set(base);
  const need = NUMBERS_PER_GAME - base.length;

  const allowed = (n: number) => !excludedSet.has(n) && !baseSet.has(n);
  const fullPool: number[] = [];
  for (let n = 1; n <= TOTAL_NUMBERS; n++) if (allowed(n)) fullPool.push(n);

  if (need <= 0) return base.slice(0, NUMBERS_PER_GAME).sort((a, b) => a - b);

  const finish = (chosen: number[]): number[] => {
    if (chosen.length < NUMBERS_PER_GAME) {
      const have = new Set(chosen);
      const rest = fullPool.filter((n) => !have.has(n));
      chosen = [...chosen, ...weightedSample(rest, weights, NUMBERS_PER_GAME - chosen.length, rng)];
    }
    return chosen.slice(0, NUMBERS_PER_GAME).sort((a, b) => a - b);
  };

  if (previousDraw && previousDraw.length >= NUMBERS_PER_GAME) {
    const prevSet = new Set(previousDraw);
    const baseFromPrev = base.filter((n) => prevSet.has(n)).length;
    const repeatTarget = repeatTargetFor(strategy, rng);
    const remainingRepeats = Math.max(0, Math.min(repeatTarget - baseFromPrev, need));

    const prevPool = fullPool.filter((n) => prevSet.has(n));
    const newPool = fullPool.filter((n) => !prevSet.has(n));

    const fromPrev = weightedSample(prevPool, weights, remainingRepeats, rng);
    const fromNew = weightedSample(newPool, weights, need - fromPrev.length, rng);
    return finish([...base, ...fromPrev, ...fromNew]);
  }

  return finish([...base, ...weightedSample(fullPool, weights, need, rng)]);
};
