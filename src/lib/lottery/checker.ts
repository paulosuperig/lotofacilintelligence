/**
 * Conferidor de jogos: mede os acertos reais de um jogo contra um resultado
 * oficial — a funcionalidade central de "assertividade" (é o que permite ao
 * usuário verificar objetivamente o desempenho, como no conferidor da Caixa).
 */
import { prizeTier, type PrizeTier } from './prizes';
import { normalizeDraw, type DrawNumbers } from './analysis';

export interface CheckResult {
  /** número de dezenas acertadas (0..15) */
  hits: number;
  /** dezenas que bateram (ordenadas) */
  matched: number[];
  /** dezenas do jogo que não saíram */
  missed: number[];
  /** faixa de premiação (11..15) ou null */
  tier: PrizeTier | null;
  /** true se acertos >= 11 */
  awarded: boolean;
}

/** Confere um único jogo contra o resultado sorteado. */
export const checkGame = (
  game: Array<string | number>,
  draw: Array<string | number>
): CheckResult => {
  const g = normalizeDraw(game);
  const d = new Set(normalizeDraw(draw));

  const matched: number[] = [];
  const missed: number[] = [];
  for (const n of g) {
    if (d.has(n)) matched.push(n);
    else missed.push(n);
  }

  const hits = matched.length;
  const tier = prizeTier(hits);
  return { hits, matched, missed, tier, awarded: tier != null };
};

export interface BatchCheckSummary {
  results: CheckResult[];
  /** total de jogos conferidos */
  total: number;
  /** total de jogos premiados (>= 11 acertos) */
  premiados: number;
  /** melhor pontuação da leva */
  melhorAcerto: number;
  /** contagem por faixa de acerto (0..15) */
  distribuicao: Record<number, number>;
}

/** Confere uma lista de jogos contra o resultado e agrega um resumo. */
export const checkGames = (
  games: Array<Array<string | number>>,
  draw: Array<string | number>
): BatchCheckSummary => {
  const d: DrawNumbers = normalizeDraw(draw);
  const results = games.map((g) => checkGame(g, d));

  const distribuicao: Record<number, number> = {};
  for (let i = 0; i <= 15; i++) distribuicao[i] = 0;

  let premiados = 0;
  let melhorAcerto = 0;
  for (const r of results) {
    distribuicao[r.hits] = (distribuicao[r.hits] ?? 0) + 1;
    if (r.awarded) premiados += 1;
    if (r.hits > melhorAcerto) melhorAcerto = r.hits;
  }

  return {
    results,
    total: results.length,
    premiados,
    melhorAcerto,
    distribuicao,
  };
};
