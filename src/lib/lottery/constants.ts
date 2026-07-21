/**
 * Fonte única da verdade para os parâmetros estatísticos da Lotofácil.
 *
 * A Lotofácil sorteia 15 dezenas de um universo de 25 (1..25).
 * As faixas abaixo foram calibradas com base na distribuição histórica real
 * dos concursos (a mesma referência usada pela Caixa em suas estatísticas
 * oficiais) e são usadas de forma CONSISTENTE por todo o app: gerador,
 * validador, prompt da IA e painéis de tendências.
 *
 * Nomenclatura:
 *  - `ideal`: faixa em que se concentra a maior parte dos concursos (~70%).
 *  - `min`/`max`: limites aceitáveis (descarta apenas os extremos raros).
 */

/** Universo de dezenas da Lotofácil. */
export const TOTAL_NUMBERS = 25;
/** Dezenas marcadas por jogo. */
export const NUMBERS_PER_GAME = 15;

/** Dezenas primas dentro de 1..25. */
export const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23] as const;
export const PRIME_SET = new Set<number>(PRIMES);

/**
 * "Moldura": as 16 dezenas da borda do volante 5x5.
 * O "miolo" é o complemento (9 dezenas centrais).
 */
export const MOLDURA = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25] as const;
export const MOLDURA_SET = new Set<number>(MOLDURA);

/** Miolo: 7,8,9,12,13,14,17,18,19. */
export const MIOLO = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).filter(
  (n) => !MOLDURA_SET.has(n)
);
export const MIOLO_SET = new Set<number>(MIOLO);

/** Múltiplos de 3 em 1..25 (usado como filtro complementar). */
export const MULTIPLES_OF_3 = [3, 6, 9, 12, 15, 18, 21, 24] as const;

/** Sequência de Fibonacci presente em 1..25. */
export const FIBONACCI = [1, 2, 3, 5, 8, 13, 21] as const;
export const FIBONACCI_SET = new Set<number>(FIBONACCI);

/**
 * Quadrantes do volante 5x5 (linhas de 5), úteis para verificar dispersão.
 * Linha 1: 1-5, Linha 2: 6-10, ... Linha 5: 21-25.
 */
export const ROWS: number[][] = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
  [21, 22, 23, 24, 25],
];

export interface Band {
  /** limite inferior aceitável (inclusive) */
  min: number;
  /** limite superior aceitável (inclusive) */
  max: number;
  /** limite inferior da faixa ideal (inclusive) */
  idealMin: number;
  /** limite superior da faixa ideal (inclusive) */
  idealMax: number;
}

/**
 * Faixas estatísticas de referência para um jogo saudável.
 * Valores calibrados com o histórico da Lotofácil.
 */
export const BANDS = {
  /** Soma das 15 dezenas. Média teórica = 195; bulk histórico 170-220. */
  soma: { min: 166, max: 224, idealMin: 180, idealMax: 210 } as Band,
  /** Quantidade de dezenas PARES (universo tem 12 pares). Média ~7.2. */
  pares: { min: 5, max: 10, idealMin: 6, idealMax: 8 } as Band,
  /** Quantidade de dezenas ÍMPARES (universo tem 13 ímpares). Média ~7.8. */
  impares: { min: 5, max: 10, idealMin: 7, idealMax: 9 } as Band,
  /** Quantidade de primos (universo tem 9). Média ~5.4. */
  primos: { min: 3, max: 7, idealMin: 4, idealMax: 6 } as Band,
  /** Dezenas na moldura (universo tem 16). Média ~9.6. */
  moldura: { min: 7, max: 12, idealMin: 9, idealMax: 11 } as Band,
  /** Dezenas no miolo (universo tem 9). Média ~5.4. */
  miolo: { min: 3, max: 8, idealMin: 4, idealMax: 6 } as Band,
  /**
   * Dezenas repetidas em relação ao concurso ANTERIOR. Média teórica = 9.
   * Regularidade empírica mais forte da Lotofácil.
   */
  repetidas: { min: 6, max: 11, idealMin: 8, idealMax: 10 } as Band,
  /** Maior sequência de dezenas consecutivas. Concentra-se em 2-4. */
  sequencia: { min: 1, max: 6, idealMin: 2, idealMax: 5 } as Band,
} as const;

export type BandKey = keyof typeof BANDS;
