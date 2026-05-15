// Post-processing of AI assistant output to guarantee mathematically valid
// Lotofácil game lines (15 unique numbers in [1,25], sorted, with correct sum).

export interface UserIntent {
  quantidade?: number;
  somaMin?: number;
  somaMax?: number;
}

export const INCOMPLETE_MARKER = '⚠️ Resposta incompleta';

const isGameLineCandidate = (line: string) => {
  const tokens = line.match(/\b\d{1,2}\b/g) || [];
  const valid = tokens
    .map((n) => parseInt(n, 10))
    .filter((n) => n >= 1 && n <= 25);
  return new Set(valid).size >= 15;
};

const sanitizeLine = (line: string): { text: string; sum: number } => {
  const labelMatch = line.match(/^(\s*(?:jogo\s*)?\d{1,2}\s*[\)\.\-:])/i);
  const label = labelMatch ? labelMatch[1].trim() : '';

  const tokens = line.match(/\b\d{1,2}\b/g) || [];
  const startIdx = labelMatch ? 1 : 0;
  const candidates = tokens
    .slice(startIdx)
    .map((n) => parseInt(n, 10))
    .filter((n) => n >= 1 && n <= 25);

  const unique: number[] = [];
  for (const n of candidates) {
    if (!unique.includes(n)) unique.push(n);
    if (unique.length === 15) break;
  }
  if (unique.length < 15) {
    for (let n = 1; n <= 25 && unique.length < 15; n++) {
      if (!unique.includes(n)) unique.push(n);
    }
  }
  const sorted = unique.sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const formatted = sorted.map((n) => String(n).padStart(2, '0')).join(', ');
  return { text: `${label ? label + ' ' : ''}${formatted}  (soma ${sum})`, sum };
};

export interface SanitizeResult {
  content: string;
  gamesFound: number;
  outOfRangeSums: number;
  incomplete: boolean;
}

export const sanitizeAiGamesDetailed = (
  content: string,
  intent?: UserIntent
): SanitizeResult => {
  if (!content) {
    return { content, gamesFound: 0, outOfRangeSums: 0, incomplete: false };
  }
  const lines = content.split('\n');
  let gamesFound = 0;
  let outOfRangeSums = 0;

  const out = lines.map((line) => {
    if (!isGameLineCandidate(line)) return line;
    const { text, sum } = sanitizeLine(line);
    gamesFound += 1;
    let suffix = '';
    if (intent?.somaMin != null && sum < intent.somaMin) {
      outOfRangeSums += 1;
      suffix = `  // ⚠️ soma ${sum} abaixo do mínimo ${intent.somaMin}`;
    } else if (intent?.somaMax != null && sum > intent.somaMax) {
      outOfRangeSums += 1;
      suffix = `  // ⚠️ soma ${sum} acima do máximo ${intent.somaMax}`;
    }
    return text + suffix;
  });

  let body = out.join('\n');
  let incomplete = false;
  const expected = intent?.quantidade;
  if (expected && gamesFound < expected) {
    incomplete = true;
    body += `\n\n> ${INCOMPLETE_MARKER}: foram entregues **${gamesFound} de ${expected}** jogos solicitados. Use o botão "Regenerar resposta completa" abaixo.`;
  }
  if (outOfRangeSums > 0) {
    body += `\n\n> ⚠️ ${outOfRangeSums} jogo(s) ficaram fora do filtro de soma solicitado.`;
  }

  return { content: body, gamesFound, outOfRangeSums, incomplete };
};

/** Backward-compatible wrapper. */
export const sanitizeAiGames = (content: string, intent?: UserIntent): string =>
  sanitizeAiGamesDetailed(content, intent).content;
