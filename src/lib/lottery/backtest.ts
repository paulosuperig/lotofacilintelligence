/**
 * Backtesting em massa: mede, sobre concursos passados, o desempenho do gerador
 * data-driven comparado ao aleatório puro.
 *
 * Metodologia (walk-forward, sem vazamento de futuro):
 * para cada concurso de teste `i`, usa APENAS o histórico anterior (`draws[0..i-1]`)
 * para construir a análise e ancorar as repetidas, gera K jogos e confere contra
 * o resultado REAL do concurso `i`. O mesmo é feito para uma estratégia aleatória
 * uniforme (baseline).
 *
 * Nota de integridade: como o sorteio é (essencialmente) uniforme, o valor
 * ESPERADO de acertos é 15·15/25 = 9 para QUALQUER conjunto de 15 dezenas —
 * nenhuma estratégia altera a probabilidade de prêmio. O objetivo do backtest é
 * justamente tornar isso transparente e medir se há qualquer viés residual.
 */
import { analyzeHistory, type DrawNumbers } from './analysis';
import { generateBatch, seededRng, type Rng } from './generator';
import { checkGame } from './checker';
import { MIN_PRIZE_HITS } from './prizes';
import { TOTAL_NUMBERS, NUMBERS_PER_GAME } from './constants';

export interface BacktestOptions {
  /** jogos gerados por concurso (default 3). */
  gamesPerDraw?: number;
  /** mínimo de concursos anteriores para começar a testar (default 50). */
  minHistory?: number;
  /** janela de análise por passo (default 100). */
  window?: number;
  /** candidatos por jogo no gerador (default 40; menor = mais rápido). */
  candidates?: number;
  /** limita o nº de concursos de teste aos mais recentes (default: todos). */
  maxDraws?: number;
  /** RNG injetável (default determinístico por semente 12345). */
  rng?: Rng;
}

export interface StrategyResult {
  totalGames: number;
  totalConcursos: number;
  /** média de acertos por jogo */
  avgHits: number;
  /** fração de jogos premiados (>= 11 acertos) */
  prizeRate: number;
  /** melhor acerto observado */
  bestHits: number;
  /** histograma acertos -> quantidade */
  distribution: Record<number, number>;
}

export interface BacktestReport {
  smart: StrategyResult;
  random: StrategyResult;
  /** diferença de média de acertos (smart - random) */
  improvementAvgHits: number;
  /** diferença de taxa de prêmio (smart - random) */
  improvementPrizeRate: number;
  sampleConcursos: number;
  gamesPerDraw: number;
}

const emptyDistribution = (): Record<number, number> => {
  const d: Record<number, number> = {};
  for (let i = 0; i <= NUMBERS_PER_GAME; i++) d[i] = 0;
  return d;
};

/** Gerador uniforme (baseline aleatório) via Fisher-Yates parcial. */
const uniformGame = (rng: Rng): number[] => {
  const pool = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
  for (let i = 0; i < NUMBERS_PER_GAME; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, NUMBERS_PER_GAME).sort((a, b) => a - b);
};

interface Accumulator {
  games: number;
  concursos: number;
  hitSum: number;
  prizes: number;
  best: number;
  dist: Record<number, number>;
}

const newAccumulator = (): Accumulator => ({
  games: 0,
  concursos: 0,
  hitSum: 0,
  prizes: 0,
  best: 0,
  dist: emptyDistribution(),
});

const record = (acc: Accumulator, hits: number) => {
  acc.games += 1;
  acc.hitSum += hits;
  acc.dist[hits] = (acc.dist[hits] ?? 0) + 1;
  if (hits >= MIN_PRIZE_HITS) acc.prizes += 1;
  if (hits > acc.best) acc.best = hits;
};

const finalize = (acc: Accumulator): StrategyResult => ({
  totalGames: acc.games,
  totalConcursos: acc.concursos,
  avgHits: acc.games > 0 ? acc.hitSum / acc.games : 0,
  prizeRate: acc.games > 0 ? acc.prizes / acc.games : 0,
  bestHits: acc.best,
  distribution: acc.dist,
});

/**
 * Executa o backtest. `drawsChronological` deve estar ordenado do MAIS ANTIGO
 * para o mais recente.
 */
export const runBacktest = (
  drawsChronological: DrawNumbers[],
  options: BacktestOptions = {}
): BacktestReport => {
  const {
    gamesPerDraw = 3,
    minHistory = 50,
    window = 100,
    candidates = 40,
    maxDraws,
    rng = seededRng(12345),
  } = options;

  const draws = drawsChronological.filter((d) => d.length === NUMBERS_PER_GAME);
  const smart = newAccumulator();
  const random = newAccumulator();

  const start = Math.max(minHistory, 1);
  const firstTest = maxDraws ? Math.max(start, draws.length - maxDraws) : start;

  for (let i = firstTest; i < draws.length; i++) {
    const historySlice = draws.slice(0, i);
    if (historySlice.length < minHistory) continue;
    const actual = draws[i];
    const previousDraw = draws[i - 1];

    // Análise apenas com o passado (histórico já está old->new).
    const analysis = analyzeHistory(historySlice, {
      newestFirst: false,
      window,
      topN: 8,
    });

    // Estratégia inteligente (data-driven + âncora de repetidas).
    const smartGames = generateBatch({
      count: gamesPerDraw,
      analysis,
      previousDraw,
      rng,
      candidates,
    });
    for (const g of smartGames) record(smart, checkGame(g.numbers, actual).hits);
    smart.concursos += 1;

    // Baseline aleatório uniforme.
    for (let k = 0; k < gamesPerDraw; k++) {
      record(random, checkGame(uniformGame(rng), actual).hits);
    }
    random.concursos += 1;
  }

  const smartResult = finalize(smart);
  const randomResult = finalize(random);

  return {
    smart: smartResult,
    random: randomResult,
    improvementAvgHits: smartResult.avgHits - randomResult.avgHits,
    improvementPrizeRate: smartResult.prizeRate - randomResult.prizeRate,
    sampleConcursos: smartResult.totalConcursos,
    gamesPerDraw,
  };
};

/** Formata o relatório em Markdown legível. */
export const formatBacktestReport = (report: BacktestReport): string => {
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
  const line = (s: StrategyResult) =>
    `média ${s.avgHits.toFixed(3)} acertos · prêmios ${pct(s.prizeRate)} · melhor ${s.bestHits} · ${s.totalGames} jogos`;

  return [
    `# Backtest — ${report.sampleConcursos} concursos · ${report.gamesPerDraw} jogos/concurso`,
    '',
    `- **Gerador inteligente:** ${line(report.smart)}`,
    `- **Aleatório puro:**      ${line(report.random)}`,
    '',
    `- Diferença de média de acertos: **${report.improvementAvgHits >= 0 ? '+' : ''}${report.improvementAvgHits.toFixed(3)}**`,
    `- Diferença de taxa de prêmio: **${report.improvementPrizeRate >= 0 ? '+' : ''}${(report.improvementPrizeRate * 100).toFixed(2)} p.p.**`,
  ].join('\n');
};
