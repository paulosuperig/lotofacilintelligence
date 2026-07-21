/**
 * Gerador "inteligente" de jogos da Lotofácil, genuinamente data-driven.
 *
 * Em vez de sortear 15 dezenas de forma uniforme e torcer para passarem nos
 * filtros (com fallback que aceitava QUALQUER jogo), este motor:
 *
 *  1. Pondera cada dezena por frequência histórica + atraso (equilíbrio
 *     quente/fria), quando há histórico disponível.
 *  2. Ancora ~9 dezenas no último concurso (regularidade empírica mais forte
 *     da Lotofácil: em média 9 das 15 se repetem), quando informado.
 *  3. Gera vários candidatos por amostragem ponderada SEM reposição e escolhe
 *     o de MAIOR aderência às faixas estatísticas de referência — nunca devolve
 *     um jogo fora de faixa por "desistência".
 *
 * Todo o núcleo é puro e determinístico dado um RNG, o que o torna testável.
 * Em produção o RNG padrão usa `crypto.getRandomValues`.
 */
import { TOTAL_NUMBERS, NUMBERS_PER_GAME, BANDS, type BandKey } from './constants';
import { computeGameMetrics, type GameMetrics } from './metrics';
import type { HistoryAnalysis } from './analysis';

export type Rng = () => number;

/** RNG criptográfico padrão (uniforme em [0,1)). */
export const cryptoRng: Rng = () => {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] / 0x100000000;
  }
  return Math.random();
};

/** mulberry32: RNG determinístico e semeável, para testes reprodutíveis. */
export const seededRng = (seed: number): Rng => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
};

export interface GenerateOptions {
  /** análise do histórico (frequência/atraso). Ausente => modo heurístico puro. */
  analysis?: HistoryAnalysis | null;
  /** último concurso, para ancorar dezenas repetidas. */
  previousDraw?: number[] | null;
  /** assinaturas de jogos a evitar (dedup contra histórico do usuário). */
  avoid?: Set<string>;
  /** RNG injetável (default: cryptoRng). */
  rng?: Rng;
  /** quantos candidatos gerar e pontuar (default 80). */
  candidates?: number;
}

export interface GeneratedGame {
  numbers: number[];
  sum: number;
  metrics: GameMetrics;
  /** 0..1 — aderência às faixas estatísticas (1 = todas ideais). */
  score: number;
  /** true se o histórico foi usado para ponderar as dezenas. */
  dataDriven: boolean;
}

/** Assinatura canônica de um jogo (para dedup). */
export const gameSignature = (nums: number[]): string =>
  [...nums].sort((a, b) => a - b).join(',');

/**
 * Peso de cada dezena para a amostragem. Combina:
 *  - base uniforme (garante que toda dezena é sorteável),
 *  - frequência histórica (dezenas mais recorrentes ganham leve vantagem),
 *  - atraso (dezenas muito atrasadas ganham leve vantagem — equilíbrio).
 * Sem histórico, todas as dezenas têm peso 1 (uniforme).
 */
export const buildWeights = (analysis?: HistoryAnalysis | null): number[] => {
  const weights = new Array(TOTAL_NUMBERS + 1).fill(1); // índice 0 não usado
  if (!analysis || analysis.totalConcursos === 0) return weights;

  const stats = analysis.ranking;
  const maxFreq = Math.max(...stats.map((s) => s.frequencia), 1);
  const maxAtraso = Math.max(...stats.map((s) => s.atraso), 1);

  for (const s of stats) {
    // frequência normalizada (0..1) e atraso normalizado (0..1)
    const fNorm = s.frequencia / maxFreq;
    const aNorm = s.atraso / maxAtraso;
    // base 1 + 0.6*frequência + 0.25*atraso => favorece quentes sem excluir frias
    weights[s.numero] = 1 + 0.6 * fNorm + 0.25 * aNorm;
  }
  return weights;
};

/** Amostragem ponderada SEM reposição de `count` dezenas do pool informado. */
const weightedSample = (
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

/** Distância normalizada de um valor à faixa ideal (0 = dentro do ideal). */
const idealPenalty = (value: number, key: BandKey): number => {
  const b = BANDS[key];
  if (value >= b.idealMin && value <= b.idealMax) return 0;
  const span = Math.max(b.max - b.min, 1);
  if (value < b.idealMin) return (b.idealMin - value) / span;
  return (value - b.idealMax) / span;
};

/**
 * Fitness de um jogo: 1.0 quando todas as métricas estão na faixa IDEAL,
 * caindo proporcionalmente conforme se afastam. Jogos fora da faixa aceitável
 * (min..max) recebem penalidade extra.
 */
export const scoreGame = (nums: number[], previousDraw?: number[] | null): number => {
  const m = computeGameMetrics(nums, previousDraw);
  const checks: Array<[number, BandKey]> = [
    [m.soma, 'soma'],
    [m.pares, 'pares'],
    [m.primos, 'primos'],
    [m.moldura, 'moldura'],
    [m.sequencia, 'sequencia'],
  ];
  if (m.repetidas != null) checks.push([m.repetidas, 'repetidas']);

  let penalty = 0;
  for (const [value, key] of checks) {
    const b = BANDS[key];
    penalty += idealPenalty(value, key);
    if (value < b.min || value > b.max) penalty += 1; // fora do aceitável: pesa mais
  }
  const score = 1 - penalty / checks.length;
  return Math.max(0, Math.min(1, score));
};

/** Gera UM candidato ponderado, possivelmente ancorado no último concurso. */
const generateCandidate = (
  weights: number[],
  previousDraw: number[] | null | undefined,
  rng: Rng
): number[] => {
  const fullPool = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);

  if (previousDraw && previousDraw.length >= NUMBERS_PER_GAME) {
    // Alvo de repetidas dentro da faixa ideal (8..10), sorteado.
    const { idealMin, idealMax } = BANDS.repetidas;
    const repeatTarget = idealMin + Math.floor(rng() * (idealMax - idealMin + 1));
    const prevSet = new Set(previousDraw);
    const notPrev = fullPool.filter((n) => !prevSet.has(n));

    const fromPrev = weightedSample([...previousDraw], weights, repeatTarget, rng);
    const remaining = NUMBERS_PER_GAME - fromPrev.length;
    const fromNew = weightedSample(notPrev, weights, remaining, rng);
    return [...fromPrev, ...fromNew].sort((a, b) => a - b);
  }

  return weightedSample(fullPool, weights, NUMBERS_PER_GAME, rng).sort((a, b) => a - b);
};

/**
 * Gera o melhor jogo dentre `candidates` candidatos ponderados.
 * Garante unicidade contra `avoid` sempre que possível.
 */
export interface BatchOptions extends GenerateOptions {
  /** quantos jogos gerar. */
  count: number;
  /**
   * sobreposição máxima de dezenas permitida entre dois jogos do lote.
   * Menor = mais diversificação/cobertura. Default 11 (recomendado pela IA
   * do próprio app). É relaxado automaticamente se necessário.
   */
  maxOverlap?: number;
}

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

export const generateOptimizedGame = (options: GenerateOptions = {}): GeneratedGame => {
  const {
    analysis = null,
    previousDraw = null,
    avoid = new Set<string>(),
    rng = cryptoRng,
    candidates = 80,
  } = options;

  const weights = buildWeights(analysis);
  const dataDriven = !!analysis && analysis.totalConcursos > 0;

  let best: number[] | null = null;
  let bestScore = -Infinity;
  let bestFallback: number[] | null = null; // melhor jogo, mesmo que duplicado
  let bestFallbackScore = -Infinity;

  const n = Math.max(1, candidates);
  for (let i = 0; i < n; i++) {
    const cand = generateCandidate(weights, previousDraw, rng);
    if (cand.length !== NUMBERS_PER_GAME) continue;
    const s = scoreGame(cand, previousDraw);

    if (s > bestFallbackScore) {
      bestFallbackScore = s;
      bestFallback = cand;
    }
    if (!avoid.has(gameSignature(cand)) && s > bestScore) {
      bestScore = s;
      best = cand;
    }
  }

  const chosen = best ?? bestFallback ?? generateCandidate(weights, previousDraw, rng);
  const finalScore = best ? bestScore : bestFallbackScore;

  return {
    numbers: chosen,
    sum: chosen.reduce((a, b) => a + b, 0),
    metrics: computeGameMetrics(chosen, previousDraw),
    score: Math.max(0, finalScore),
    dataDriven,
  };
};
