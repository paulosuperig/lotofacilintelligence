/**
 * Motor de FECHAMENTO (wheeling) real para a Lotofácil.
 *
 * Um fechamento reduz um "pool" de N dezenas (N > 15) a um conjunto menor de
 * jogos de 15 dezenas, de modo que — SE as 15 dezenas sorteadas estiverem todas
 * dentro das N escolhidas — ao menos um jogo atinja uma pontuação mínima
 * GARANTIDA.
 *
 * Diferente da versão anterior (que era `Math.random()` com um selo "Garantido"
 * falso), aqui a garantia é **calculada e verificada exaustivamente**: testamos
 * todas as C(N,15) formas de as 15 dezenas caírem dentro do pool e reportamos o
 * pior caso real. Nunca exibimos uma garantia que não tenha sido verificada.
 *
 * Formalização: um jogo é um subconjunto de 15 dezenas do pool; um sorteio
 * (dentro do pool) também. Representamos ambos como bitmasks sobre os índices do
 * pool e a pontuação é o popcount da interseção. A garantia é
 *   min_{sorteio ⊆ pool, |sorteio|=15}  max_{jogo ∈ conjunto} |jogo ∩ sorteio|.
 */
import { NUMBERS_PER_GAME } from './constants';
import { cryptoRng, type Rng } from './generator';

const popcount = (x: number): number => {
  let c = 0;
  let v = x;
  while (v) {
    v &= v - 1;
    c++;
  }
  return c;
};

/** Todas as combinações de `k` índices em [0..n-1], como bitmasks. */
export const combinationMasks = (n: number, k: number): number[] => {
  const res: number[] = [];
  if (k > n || k < 0) return res;
  if (k === 0) return [0];
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    let mask = 0;
    for (const i of idx) mask |= 1 << i;
    res.push(mask);
    let p = k - 1;
    while (p >= 0 && idx[p] === n - k + p) p--;
    if (p < 0) break;
    idx[p]++;
    for (let j = p + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
  return res;
};

/** Converte um bitmask de índices do pool para as dezenas correspondentes. */
const maskToNumbers = (mask: number, pool: number[]): number[] => {
  const out: number[] = [];
  for (let i = 0; i < pool.length; i++) if (mask & (1 << i)) out.push(pool[i]);
  return out.sort((a, b) => a - b);
};

export interface WheelResult {
  /** pool de dezenas usado (ordenado) */
  pool: number[];
  /** jogos gerados (cada um com 15 dezenas ordenadas) */
  games: number[][];
  /**
   * pontos GARANTIDOS (verificados): se as 15 dezenas sorteadas estiverem entre
   * as do pool, ao menos um jogo terá pelo menos esta pontuação.
   */
  guarantee: number;
  /** nº de jogos no fechamento */
  numGames: number;
}

/**
 * Calcula (exaustivamente) a garantia de um conjunto de jogos para um dado pool.
 * `gameMasks` e a enumeração de sorteios são feitos em espaço de bitmask.
 */
const computeGuaranteeMasks = (gameMasks: number[], drawMasks: number[]): number => {
  if (gameMasks.length === 0) return 0;
  let worst = NUMBERS_PER_GAME;
  for (const draw of drawMasks) {
    let best = 0;
    for (const g of gameMasks) {
      const h = popcount(g & draw);
      if (h > best) best = h;
      if (best === NUMBERS_PER_GAME) break;
    }
    if (best < worst) worst = best;
    if (worst === 0) break;
  }
  return worst;
};

export interface WheelOptions {
  /** dezenas do pool (serão deduplicadas/ordenadas). Deve ter > 15 dezenas. */
  pool: number[];
  /** quantidade de jogos desejada no fechamento. */
  numGames: number;
  /** RNG injetável (default cryptoRng) para amostragem de candidatos. */
  rng?: Rng;
  /**
   * máximo de candidatos avaliados por passo do greedy. Se omitido, é derivado
   * do tamanho do espaço de sorteios para manter o cálculo rápido no navegador.
   */
  maxCandidates?: number;
}

/**
 * Gera um fechamento (wheel) maximizando, de forma gulosa (maximin), a garantia
 * verificada. A garantia final é sempre computada exaustivamente sobre todos os
 * sorteios possíveis dentro do pool.
 */
export const generateWheel = (options: WheelOptions): WheelResult => {
  const { rng = cryptoRng } = options;
  const pool = Array.from(new Set(options.pool))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 25)
    .sort((a, b) => a - b);

  const N = pool.length;
  if (N <= NUMBERS_PER_GAME) {
    // Pool insuficiente para reduzir: o "fechamento" é o próprio jogo/pool.
    const single = pool.slice(0, NUMBERS_PER_GAME);
    return { pool, games: single.length === NUMBERS_PER_GAME ? [single] : [], guarantee: single.length === NUMBERS_PER_GAME ? NUMBERS_PER_GAME : 0, numGames: single.length === NUMBERS_PER_GAME ? 1 : 0 };
  }

  const drawMasks = combinationMasks(N, NUMBERS_PER_GAME); // sorteios possíveis no pool
  const totalPossible = drawMasks.length;
  const target = Math.max(1, Math.min(options.numGames, totalPossible));

  // Se pedirmos todos os jogos possíveis, garante 15.
  if (target >= totalPossible) {
    return {
      pool,
      games: drawMasks.map((m) => maskToNumbers(m, pool)),
      guarantee: NUMBERS_PER_GAME,
      numGames: totalPossible,
    };
  }

  // Espaço de candidatos = os próprios sorteios possíveis (15-subconjuntos).
  // Orçamento de candidatos adaptativo: mantém o custo (~candidatos × sorteios ×
  // jogos) limitado para não travar a UI em pools grandes.
  const useAll = totalPossible <= 1500;
  const maxCandidates =
    options.maxCandidates ??
    Math.max(120, Math.min(400, Math.floor(1_200_000 / totalPossible)));
  const bestHits = new Int8Array(totalPossible); // melhor pontuação por sorteio
  const chosenMasks: number[] = [];
  const chosenSet = new Set<number>();

  const sampleCandidates = (): number[] => {
    if (useAll) return drawMasks;
    const out: number[] = [];
    const seen = new Set<number>();
    let guard = 0;
    while (out.length < maxCandidates && guard < maxCandidates * 8) {
      guard++;
      const i = Math.floor(rng() * totalPossible);
      if (seen.has(i)) continue;
      seen.add(i);
      out.push(drawMasks[i]);
    }
    return out;
  };

  for (let step = 0; step < target; step++) {
    const candidates = sampleCandidates();
    let bestCand = -1;
    let bestMin = -1;
    let bestGain = -1;

    for (const cand of candidates) {
      if (chosenSet.has(cand)) continue;
      let tentativeMin = NUMBERS_PER_GAME;
      let gain = 0;
      for (let d = 0; d < totalPossible; d++) {
        const h = popcount(cand & drawMasks[d]);
        const nb = h > bestHits[d] ? h : bestHits[d];
        if (nb > bestHits[d]) gain += nb - bestHits[d];
        if (nb < tentativeMin) tentativeMin = nb;
      }
      if (tentativeMin > bestMin || (tentativeMin === bestMin && gain > bestGain)) {
        bestMin = tentativeMin;
        bestGain = gain;
        bestCand = cand;
      }
    }

    if (bestCand < 0) break;
    chosenMasks.push(bestCand);
    chosenSet.add(bestCand);
    for (let d = 0; d < totalPossible; d++) {
      const h = popcount(bestCand & drawMasks[d]);
      if (h > bestHits[d]) bestHits[d] = h;
    }
  }

  const guarantee = computeGuaranteeMasks(chosenMasks, drawMasks);
  return {
    pool,
    games: chosenMasks.map((m) => maskToNumbers(m, pool)),
    guarantee,
    numGames: chosenMasks.length,
  };
};

/**
 * Verifica a garantia de um conjunto arbitrário de jogos contra um pool
 * (útil para testes e para auditar fechamentos externos).
 */
export const verifyWheelGuarantee = (games: number[][], pool: number[]): number => {
  const sortedPool = Array.from(new Set(pool)).sort((a, b) => a - b);
  const index = new Map(sortedPool.map((n, i) => [n, i]));
  const toMask = (g: number[]): number => {
    let m = 0;
    for (const n of g) {
      const i = index.get(n);
      if (i != null) m |= 1 << i;
    }
    return m;
  };
  const gameMasks = games.map(toMask);
  const drawMasks = combinationMasks(sortedPool.length, NUMBERS_PER_GAME);
  return computeGuaranteeMasks(gameMasks, drawMasks);
};
