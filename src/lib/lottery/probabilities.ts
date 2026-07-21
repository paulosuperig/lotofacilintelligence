/**
 * Probabilidades OFICIAIS da Lotofácil, calculadas por combinatória exata
 * (distribuição hipergeométrica) e conferidas contra os números divulgados pela
 * Caixa Econômica Federal.
 *
 * Para uma aposta simples de 15 dezenas, a chance de acertar exatamente `k`
 * dezenas (das 15 sorteadas, em um universo de 25) é:
 *
 *     P(k) = C(15, k) · C(10, 15 - k) / C(25, 15)
 *
 * onde C(25,15) = 3.268.760 (total de jogos possíveis).
 *
 * Exibir a probabilidade real é um padrão de transparência da própria Caixa e
 * um diferencial de integridade: nenhuma "estratégia" altera estes números.
 */
import { MIN_PRIZE_HITS, MAX_HITS } from './prizes';

/** Coeficiente binomial exato C(n, k). */
export const binomial = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  const kk = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < kk; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
};

/** Total de combinações possíveis de uma aposta simples: C(25,15). */
export const TOTAL_COMBINATIONS = binomial(25, 15); // 3.268.760

export interface OddsEntry {
  /** número de acertos (11..15) */
  hits: number;
  /** número de combinações favoráveis */
  ways: number;
  /** probabilidade (0..1) */
  probability: number;
  /** "1 em N" (N arredondado) */
  oneIn: number;
}

/**
 * Probabilidade de acertar exatamente `hits` dezenas em uma aposta simples de
 * 15 dezenas.
 */
export const oddsForHits = (hits: number): OddsEntry => {
  const ways = binomial(15, hits) * binomial(10, 15 - hits);
  const probability = ways / TOTAL_COMBINATIONS;
  return {
    hits,
    ways,
    probability,
    oneIn: probability > 0 ? Math.round(1 / probability) : Infinity,
  };
};

/** Tabela oficial das faixas premiadas (11..15 acertos), da maior à menor. */
export const PRIZE_ODDS: OddsEntry[] = Array.from(
  { length: MAX_HITS - MIN_PRIZE_HITS + 1 },
  (_, i) => oddsForHits(MAX_HITS - i)
);

/** Formata "1 em N" com separador de milhar pt-BR. */
export const formatOneIn = (oneIn: number): string => {
  if (!Number.isFinite(oneIn)) return '—';
  return `1 em ${oneIn.toLocaleString('pt-BR')}`;
};

/**
 * Probabilidade de ganhar (faixa principal, 15 acertos) jogando `numGames`
 * apostas simples DISTINTAS. Aproximação por união disjunta (jogos distintos):
 * numGames / C(25,15). Útil para contextualizar fechamentos.
 */
export const oddsFor15WithGames = (numGames: number): OddsEntry => {
  const games = Math.max(0, Math.floor(numGames));
  const probability = games / TOTAL_COMBINATIONS;
  return {
    hits: MAX_HITS,
    ways: games,
    probability,
    oneIn: probability > 0 ? Math.round(1 / probability) : Infinity,
  };
};
