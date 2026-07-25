/**
 * Extrai o VALOR do prêmio por faixa de acertos a partir do campo `premiacoes`
 * de um resultado oficial. Lógica pura e testável.
 *
 * As APIs da Lotofácil trazem `premiacoes` como uma lista por faixa. Cada item
 * costuma ter `descricao` ("15 acertos") e/ou `faixa` (1 = 15 acertos … 5 = 11),
 * além de `ganhadores` e `valorPremio`. Normalizamos ambos os formatos.
 */
import { MIN_PRIZE_HITS, MAX_HITS } from './prizes';

export interface Premiacao {
  descricao?: string;
  faixa?: number;
  ganhadores?: number;
  valorPremio?: number;
}

export interface PrizeInfo {
  /** nº de acertos desta faixa (11..15) */
  acertos: number;
  /** ganhadores na faixa, quando informado */
  ganhadores: number | null;
  /** valor do prêmio por aposta na faixa (BRL), quando informado */
  valor: number | null;
}

/** Deduz o nº de acertos (11..15) de um item de premiação. */
export const acertosDaPremiacao = (p: Premiacao): number | null => {
  if (p.descricao) {
    const m = p.descricao.match(/\d{1,2}/);
    if (m) {
      const n = parseInt(m[0], 10);
      if (n >= MIN_PRIZE_HITS && n <= MAX_HITS) return n;
    }
  }
  // faixa: 1 = 15 acertos, 2 = 14, 3 = 13, 4 = 12, 5 = 11 → acertos = 16 - faixa
  if (typeof p.faixa === 'number' && p.faixa >= 1 && p.faixa <= 5) {
    return (MAX_HITS + 1) - p.faixa;
  }
  return null;
};

/**
 * Retorna o prêmio correspondente a um nº de acertos, ou null se não houver
 * faixa premiada (acertos < 11) ou o dado não existir.
 */
export const prizeForHits = (
  premiacoes: Premiacao[] | undefined | null,
  hits: number
): PrizeInfo | null => {
  if (hits < MIN_PRIZE_HITS || hits > MAX_HITS) return null;
  if (!Array.isArray(premiacoes)) return null;
  const match = premiacoes.find((p) => acertosDaPremiacao(p) === hits);
  if (!match) return null;
  return {
    acertos: hits,
    ganhadores: typeof match.ganhadores === 'number' ? match.ganhadores : null,
    valor: typeof match.valorPremio === 'number' ? match.valorPremio : null,
  };
};

/** Formata um valor em BRL (ou "—" quando indisponível). */
export const formatBRL = (valor: number | null): string =>
  valor == null
    ? '—'
    : valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
