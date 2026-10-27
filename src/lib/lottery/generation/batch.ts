import { gameSignature } from '../gameSignature';
import { cryptoRng } from './rng';
import type { BatchOptions, GeneratedGame } from './types';
import { generateOptimizedGame } from './optimize';

/** Nº de dezenas em comum entre dois jogos. */
const overlap = (a: number[], b: number[]): number => {
  const setB = new Set(b);
  return a.reduce((acc, n) => acc + (setB.has(n) ? 1 : 0), 0);
};

/**
 * Gera um LOTE de jogos diversificados: cada jogo é otimizado e nenhum par
 * repete mais do que `maxOverlap` dezenas entre si (relaxando o limite caso a
 * diversificação fique inviável). Amplia a cobertura de dezenas do conjunto.
 */
export const generateBatch = (options: BatchOptions): GeneratedGame[] => {
  const { count, maxOverlap = 11, rng = cryptoRng, ...rest } = options;
  const n = Math.max(1, Math.min(count, 50));

  const chosen: GeneratedGame[] = [];
  const signatures = new Set<string>(options.avoid ?? []);

  let limit = maxOverlap;
  let safety = 0;
  while (chosen.length < n && safety < n * 40) {
    safety += 1;
    const candidate = generateOptimizedGame({ ...rest, rng, avoid: signatures });
    const tooSimilar = chosen.some((g) => overlap(g.numbers, candidate.numbers) > limit);
    if (tooSimilar) {
      // afrouxa gradualmente o limite para não travar em lotes grandes
      if (safety % (n * 4) === 0 && limit < 14) limit += 1;
      continue;
    }
    chosen.push(candidate);
    signatures.add(gameSignature(candidate.numbers));
  }

  // Fallback: se a diversificação impediu completar o lote, preenche o restante
  // aceitando qualquer jogo otimizado não-duplicado.
  while (chosen.length < n) {
    const candidate = generateOptimizedGame({ ...rest, rng, avoid: signatures });
    chosen.push(candidate);
    signatures.add(gameSignature(candidate.numbers));
  }

  return chosen;
};
