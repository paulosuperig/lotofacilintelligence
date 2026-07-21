/**
 * Análise estatística do HISTÓRICO de concursos da Lotofácil.
 *
 * Transforma a lista de sorteios em frequências, atrasos e classificação
 * quente/fria por dezena — a base factual que o gerador "inteligente" e os
 * painéis de tendência passam a consumir (antes eram números fixos no código).
 */
import { TOTAL_NUMBERS, NUMBERS_PER_GAME } from './constants';

/** Um concurso reduzido às suas 15 dezenas (ordenadas, 1..25). */
export type DrawNumbers = number[];

export interface NumberStat {
  /** dezena (1..25) */
  numero: number;
  /** número de vezes que saiu no período analisado */
  frequencia: number;
  /** percentual de concursos em que apareceu (0..1) */
  percentual: number;
  /** concursos decorridos desde a última aparição (0 = saiu no último) */
  atraso: number;
  /** maior atraso já observado no período */
  maiorAtraso: number;
}

export interface HistoryAnalysis {
  /** total de concursos considerados (apenas válidos, com 15 dezenas) */
  totalConcursos: number;
  /** concursos descartados por estarem malformados (data quality) */
  descartados: number;
  /** estatística por dezena, indexada por número (1..25) */
  porNumero: Record<number, NumberStat>;
  /** todas as dezenas ordenadas por frequência desc */
  ranking: NumberStat[];
  /** dezenas mais frequentes (quentes) */
  quentes: number[];
  /** dezenas menos frequentes (frias) */
  frias: number[];
  /** dezenas mais atrasadas (maior atraso atual) */
  atrasadas: number[];
  /** último sorteio conhecido (para cálculo de repetidas) */
  ultimoSorteio: DrawNumbers | null;
}

/**
 * Normaliza uma coleção heterogênea de dezenas (strings ou números) para um
 * array ordenado de inteiros válidos e únicos (1..25).
 */
export const normalizeDraw = (arr: Array<string | number> | undefined | null): DrawNumbers => {
  if (!arr) return [];
  return Array.from(
    new Set(
      arr
        .map((n) => (typeof n === 'number' ? n : parseInt(String(n), 10)))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_NUMBERS)
    )
  ).sort((a, b) => a - b);
};

/**
 * Analisa o histórico. `draws` deve estar ordenado do MAIS RECENTE para o mais
 * antigo (padrão das APIs da Caixa/loteriascaixa) OU do mais antigo para o mais
 * recente — o parâmetro `newestFirst` controla a interpretação.
 *
 * `topN` controla quantas dezenas entram nas listas quentes/frias/atrasadas.
 */
export const analyzeHistory = (
  rawDraws: Array<Array<string | number>>,
  options: { newestFirst?: boolean; topN?: number; window?: number } = {}
): HistoryAnalysis => {
  const { newestFirst = true, topN = 8, window } = options;

  // Robustez: só consideramos concursos VÁLIDOS (exatamente 15 dezenas únicas
  // em 1..25). Sorteios malformados vindos da API são descartados para não
  // distorcer frequências e atrasos.
  const normalized = rawDraws.map(normalizeDraw);
  let draws = normalized.filter((d) => d.length === NUMBERS_PER_GAME);
  const descartados = normalized.length - draws.length;
  if (newestFirst) draws = draws.reverse();
  // Opcionalmente restringe a uma janela dos últimos N concursos.
  if (window && window > 0 && draws.length > window) {
    draws = draws.slice(draws.length - window);
  }

  const total = draws.length;
  const freq: Record<number, number> = {};
  const lastSeenIndex: Record<number, number> = {};
  const maxGap: Record<number, number> = {};
  const prevSeen: Record<number, number> = {};

  for (let n = 1; n <= TOTAL_NUMBERS; n++) {
    freq[n] = 0;
    lastSeenIndex[n] = -1;
    maxGap[n] = 0;
    prevSeen[n] = -1;
  }

  draws.forEach((draw, idx) => {
    const present = new Set(draw);
    for (let n = 1; n <= TOTAL_NUMBERS; n++) {
      if (present.has(n)) {
        freq[n] += 1;
        if (prevSeen[n] >= 0) {
          const gap = idx - prevSeen[n];
          if (gap > maxGap[n]) maxGap[n] = gap;
        }
        prevSeen[n] = idx;
        lastSeenIndex[n] = idx;
      }
    }
  });

  const porNumero: Record<number, NumberStat> = {};
  const ranking: NumberStat[] = [];
  for (let n = 1; n <= TOTAL_NUMBERS; n++) {
    const atraso = lastSeenIndex[n] >= 0 ? total - 1 - lastSeenIndex[n] : total;
    const stat: NumberStat = {
      numero: n,
      frequencia: freq[n],
      percentual: total > 0 ? freq[n] / total : 0,
      atraso,
      maiorAtraso: Math.max(maxGap[n], atraso),
    };
    porNumero[n] = stat;
    ranking.push(stat);
  }

  ranking.sort((a, b) => b.frequencia - a.frequencia || a.numero - b.numero);

  const quentes = ranking.slice(0, topN).map((s) => s.numero);
  const frias = ranking.slice(-topN).map((s) => s.numero).reverse();
  const atrasadas = [...ranking]
    .sort((a, b) => b.atraso - a.atraso || a.numero - b.numero)
    .slice(0, topN)
    .map((s) => s.numero);

  return {
    totalConcursos: total,
    descartados,
    porNumero,
    ranking,
    quentes,
    frias,
    atrasadas,
    ultimoSorteio: draws.length > 0 ? draws[draws.length - 1] : null,
  };
};
