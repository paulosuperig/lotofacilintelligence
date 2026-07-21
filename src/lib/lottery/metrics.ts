/**
 * Métricas de um único jogo da Lotofácil, calculadas a partir dos parâmetros
 * centralizados em `constants.ts`.
 */
import {
  PRIME_SET,
  MOLDURA_SET,
  FIBONACCI_SET,
  MULTIPLES_OF_3,
  BANDS,
  type BandKey,
} from './constants';

export interface GameMetrics {
  /** dezenas pares */
  pares: number;
  /** dezenas ímpares */
  impares: number;
  /** dezenas primas */
  primos: number;
  /** soma das dezenas */
  soma: number;
  /** dezenas na moldura */
  moldura: number;
  /** dezenas no miolo */
  miolo: number;
  /** múltiplos de 3 */
  multiplos3: number;
  /** dezenas de Fibonacci */
  fibonacci: number;
  /** maior sequência consecutiva */
  sequencia: number;
  /** repetidas em relação ao concurso anterior (quando informado) */
  repetidas: number | null;
}

const MULT3_SET = new Set<number>(MULTIPLES_OF_3);

/** Maior sequência de dezenas consecutivas em um conjunto ordenado. */
export const maxConsecutive = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
};

/**
 * Calcula todas as métricas de um jogo. `previousDraw` (opcional) permite
 * computar quantas dezenas se repetem em relação ao concurso anterior.
 */
export const computeGameMetrics = (
  nums: number[],
  previousDraw?: number[] | null
): GameMetrics => {
  const pares = nums.filter((n) => n % 2 === 0).length;
  const primos = nums.filter((n) => PRIME_SET.has(n)).length;
  const moldura = nums.filter((n) => MOLDURA_SET.has(n)).length;
  const multiplos3 = nums.filter((n) => MULT3_SET.has(n)).length;
  const fibonacci = nums.filter((n) => FIBONACCI_SET.has(n)).length;
  const soma = nums.reduce((a, b) => a + b, 0);

  let repetidas: number | null = null;
  if (previousDraw && previousDraw.length > 0) {
    const prev = new Set(previousDraw);
    repetidas = nums.filter((n) => prev.has(n)).length;
  }

  return {
    pares,
    impares: nums.length - pares,
    primos,
    soma,
    moldura,
    miolo: nums.length - moldura,
    multiplos3,
    fibonacci,
    sequencia: maxConsecutive(nums),
    repetidas,
  };
};

/**
 * Retrocompatível com a API antiga de `lib/lottery/stats.ts`.
 * @deprecated Prefira `computeGameMetrics`.
 */
export const calculateGameStats = (nums: number[]) => {
  const m = computeGameMetrics(nums);
  return {
    pairs: m.pares,
    odd: m.impares,
    primes: m.primos,
    sum: m.soma,
    mold: m.moldura,
    sequence: m.sequencia,
  };
};

/** Verifica se um valor está dentro da faixa aceitável (min..max) de uma banda. */
export const isWithinBand = (value: number, key: BandKey): boolean => {
  const b = BANDS[key];
  return value >= b.min && value <= b.max;
};

/** Verifica se um valor está dentro da faixa IDEAL de uma banda. */
export const isWithinIdealBand = (value: number, key: BandKey): boolean => {
  const b = BANDS[key];
  return value >= b.idealMin && value <= b.idealMax;
};
