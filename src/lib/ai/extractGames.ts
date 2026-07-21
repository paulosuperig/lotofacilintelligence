/**
 * Extração robusta de jogos da Lotofácil a partir do texto/markdown gerado pela
 * IA. Faz o parsing LINHA A LINHA e remove rótulos de jogo ("Jogo NN:", "NN)")
 * antes de coletar as dezenas — evitando misturar números da análise (somas,
 * "8 pares", datas, percentuais) com as dezenas reais dos jogos.
 */

const NUMBERS_PER_GAME = 15;

// Rótulo no início da linha: "Jogo 01:", "01)", "1.", "12 -", etc.
const LABEL_RE = /^\s*(?:jogo\s*)?\d{1,2}\s*[).:-]\s*/i;

/**
 * Extrai um único jogo (15 dezenas ordenadas) de uma linha, ou null se a linha
 * não contiver 15 dezenas válidas.
 */
export const extractGameFromLine = (line: string): number[] | null => {
  const stripped = line.replace(LABEL_RE, '');
  const tokens = stripped.match(/\b\d{1,2}\b/g) || [];
  const nums = tokens
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 25);
  const unique = Array.from(new Set(nums));
  if (unique.length < NUMBERS_PER_GAME) return null;
  return unique.slice(0, NUMBERS_PER_GAME).sort((a, b) => a - b);
};

/** True se a linha representa um jogo válido. */
export const isGameLine = (line: string): boolean => extractGameFromLine(line) !== null;

/**
 * Extrai TODOS os jogos distintos de um texto (uma linha por jogo),
 * deduplicando por assinatura.
 */
export const extractGamesFromText = (content: string): number[][] => {
  if (!content) return [];
  const games: number[][] = [];
  const seen = new Set<string>();
  for (const line of content.split('\n')) {
    const game = extractGameFromLine(line);
    if (!game) continue;
    const sig = game.join(',');
    if (seen.has(sig)) continue;
    seen.add(sig);
    games.push(game);
  }
  return games;
};
