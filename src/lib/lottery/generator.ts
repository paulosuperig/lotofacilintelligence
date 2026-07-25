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

/**
 * Estratégias de composição do gerador — espelham as do Intelligence AI, dando
 * ao usuário as mesmas opções no gerador determinístico.
 */
export type GenStrategy =
  | 'equilibrada'
  | 'quentes'
  | 'atrasadas'
  | 'repetidas'
  | 'ciclo'
  | 'agressiva'
  /** Surpresinha: aleatório UNIFORME, igual à geração oficial da Caixa. */
  | 'surpresinha';

interface StrategyConfig {
  /** peso da frequência (favorece "quentes") na amostragem */
  freqW: number;
  /** peso do atraso (favorece "atrasadas") na amostragem */
  atrasoW: number;
  /** viés do alvo de repetidas do último concurso */
  repeatBias: 'high' | 'mid' | 'low';
}

const STRATEGY: Record<GenStrategy, StrategyConfig> = {
  equilibrada: { freqW: 0.6, atrasoW: 0.25, repeatBias: 'mid' },
  quentes: { freqW: 1.1, atrasoW: 0.1, repeatBias: 'mid' },
  atrasadas: { freqW: 0.15, atrasoW: 1.1, repeatBias: 'mid' },
  repetidas: { freqW: 0.6, atrasoW: 0.25, repeatBias: 'high' },
  ciclo: { freqW: 0.4, atrasoW: 0.8, repeatBias: 'low' },
  agressiva: { freqW: 0.25, atrasoW: 0.7, repeatBias: 'low' },
  // Surpresinha: pesos uniformes; o caminho dedicado ignora esta config.
  surpresinha: { freqW: 0, atrasoW: 0, repeatBias: 'mid' },
};

/** Alvo de dezenas repetidas do último concurso, conforme o viés da estratégia. */
const repeatTargetFor = (strategy: GenStrategy, rng: Rng): number => {
  const { idealMin, idealMax } = BANDS.repetidas;
  const span = idealMax - idealMin;
  const bias = STRATEGY[strategy].repeatBias;
  const jitter = Math.floor(rng() * Math.min(2, span + 1));
  if (bias === 'high') return idealMax - jitter;
  if (bias === 'low') return idealMin + jitter;
  return idealMin + Math.floor(rng() * (span + 1));
};

/** Normaliza uma lista de dezenas para inteiros válidos e únicos (1..25). */
const cleanDezenas = (arr?: number[] | null): number[] =>
  Array.from(new Set((arr ?? []).filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_NUMBERS)));

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
  /** estratégia de composição (default: equilibrada). */
  strategy?: GenStrategy;
  /** dezenas que DEVEM aparecer em todos os jogos. */
  fixed?: number[];
  /** dezenas que NÃO PODEM aparecer em nenhum jogo. */
  excluded?: number[];
  /** faixa de soma preferida (soft): candidatos fora recebem penalidade no ranking. */
  sumMin?: number;
  sumMax?: number;
  /** faixa de PARES preferida (soft). Ímpares = 15 − pares. */
  paresMin?: number;
  paresMax?: number;
  /** faixa de PRIMOS preferida (soft). */
  primosMin?: number;
  primosMax?: number;
  /** maior sequência consecutiva máxima preferida (soft). */
  seqMax?: number;
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

interface CandidateConstraints {
  fixed: number[];
  excludedSet: Set<number>;
  strategy: GenStrategy;
}

/**
 * Gera UM candidato ponderado, honrando dezenas fixas/excluídas e ancorando no
 * último concurso conforme a estratégia. Nunca inclui uma excluída nem omite
 * uma fixa; nunca fabrica repetição (só amostra do pool permitido).
 */
const generateCandidate = (
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
    strategy = 'equilibrada',
    sumMin,
    sumMax,
    paresMin,
    paresMax,
    primosMin,
    primosMax,
    seqMax,
  } = options;

  // Restrições do usuário sanitizadas: excluídas nunca engolem as fixas, e o
  // total de excluídas é limitado para que sempre reste pool >= 15.
  const fixed = cleanDezenas(options.fixed).slice(0, NUMBERS_PER_GAME);
  const fixedSet = new Set(fixed);
  const maxExcluded = TOTAL_NUMBERS - NUMBERS_PER_GAME; // 10
  const excludedSet = new Set(
    cleanDezenas(options.excluded).filter((n) => !fixedSet.has(n)).slice(0, maxExcluded)
  );
  const constraints: CandidateConstraints = { fixed, excludedSet, strategy };

  // SURPRESINHA (padrão da Caixa): geração ALEATÓRIA UNIFORME. Ignora pesos
  // estatísticos, âncora de repetidas, filtros e a seleção "melhor de N" — pega
  // um único sorteio uniforme (honrando fixas/excluídas), como a geração oficial.
  if (strategy === 'surpresinha') {
    const uniform = new Array(TOTAL_NUMBERS + 1).fill(1);
    let pick: number[] = [];
    for (let i = 0; i < 40; i++) {
      const cand = generateCandidate(uniform, null, rng, constraints);
      pick = cand;
      if (cand.length === NUMBERS_PER_GAME && !avoid.has(gameSignature(cand))) break;
    }
    return {
      numbers: pick,
      sum: pick.reduce((a, b) => a + b, 0),
      metrics: computeGameMetrics(pick, previousDraw),
      score: scoreGame(pick, previousDraw),
      dataDriven: false,
    };
  }

  const weights = buildWeights(analysis, strategy);
  const dataDriven = !!analysis && analysis.totalConcursos > 0;

  // Penalidades soft por métrica fora da faixa pedida pelo usuário. `scale`
  // calibra o peso: soma varia ~100 (÷100), pares/primos variam ~poucas unidades
  // (÷2, logo cada unidade fora ≈ 0.5 de penalidade).
  const rangePenalty = (
    value: number,
    min: number | undefined,
    max: number | undefined,
    scale: number
  ): number => {
    if (min != null && value < min) return (min - value) / scale;
    if (max != null && value > max) return (value - max) / scale;
    return 0;
  };
  const effScore = (nums: number[]): number => {
    const m = computeGameMetrics(nums, previousDraw);
    return (
      scoreGame(nums, previousDraw) -
      rangePenalty(m.soma, sumMin, sumMax, 100) -
      rangePenalty(m.pares, paresMin, paresMax, 2) -
      rangePenalty(m.primos, primosMin, primosMax, 2) -
      rangePenalty(m.sequencia, undefined, seqMax, 2)
    );
  };

  let best: number[] | null = null;
  let bestScore = -Infinity;
  let bestFallback: number[] | null = null; // melhor jogo, mesmo que duplicado
  let bestFallbackScore = -Infinity;

  const n = Math.max(1, candidates);
  for (let i = 0; i < n; i++) {
    const cand = generateCandidate(weights, previousDraw, rng, constraints);
    if (cand.length !== NUMBERS_PER_GAME) continue;
    const s = effScore(cand);

    if (s > bestFallbackScore) {
      bestFallbackScore = s;
      bestFallback = cand;
    }
    if (!avoid.has(gameSignature(cand)) && s > bestScore) {
      bestScore = s;
      best = cand;
    }
  }

  const chosen = best ?? bestFallback ?? generateCandidate(weights, previousDraw, rng, constraints);
  const finalScore = best ? bestScore : bestFallbackScore;

  return {
    numbers: chosen,
    sum: chosen.reduce((a, b) => a + b, 0),
    metrics: computeGameMetrics(chosen, previousDraw),
    score: Math.max(0, finalScore),
    dataDriven,
  };
};
