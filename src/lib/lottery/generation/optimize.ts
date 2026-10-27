import { TOTAL_NUMBERS, NUMBERS_PER_GAME } from '../constants';
import { computeGameMetrics } from '../metrics';
import { gameSignature } from '../gameSignature';
import { cryptoRng } from './rng';
import type { GenerateOptions, GeneratedGame } from './types';
import { cleanDezenas } from './strategy';
import { buildWeights } from './weights';
import { scoreGame } from './scoring';
import { generateCandidate, type CandidateConstraints } from './candidate';

/**
 * Gera o melhor jogo dentre `candidates` candidatos ponderados.
 * Garante unicidade contra `avoid` sempre que possível.
 */
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
