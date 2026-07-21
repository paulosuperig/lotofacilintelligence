/**
 * Faixas de premiação da Lotofácil. O jogador é premiado ao acertar de 11 a 15
 * dezenas. Os valores por faixa variam a cada concurso (rateio); aqui tratamos
 * apenas das FAIXAS (quantidade de acertos que premia), não dos valores.
 */

/** Menor número de acertos que gera prêmio. */
export const MIN_PRIZE_HITS = 11;
/** Acertos máximos (prêmio principal). */
export const MAX_HITS = 15;

export type PrizeTier = 11 | 12 | 13 | 14 | 15;

/** Retorna a faixa de premiação para um dado nº de acertos, ou null. */
export const prizeTier = (hits: number): PrizeTier | null => {
  if (hits >= MIN_PRIZE_HITS && hits <= MAX_HITS) return hits as PrizeTier;
  return null;
};

/** Rótulo curto amigável para a faixa. */
export const prizeLabel = (hits: number): string => {
  const tier = prizeTier(hits);
  if (tier == null) return `${hits} acertos`;
  if (tier === MAX_HITS) return '15 pontos • Prêmio máximo';
  return `${tier} pontos • Premiado`;
};
