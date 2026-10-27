import type { GameMetrics } from '../metrics';
import type { HistoryAnalysis } from '../analysis';
import type { Rng } from './rng';

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
