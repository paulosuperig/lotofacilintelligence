// Post-processing of AI assistant output to guarantee mathematically valid
// Lotofácil game lines (15 unique numbers in [1,25], sorted, with correct sum).

const isGameLineCandidate = (line: string) => {
  const tokens = line.match(/\b\d{1,2}\b/g) || [];
  const valid = tokens
    .map((n) => parseInt(n, 10))
    .filter((n) => n >= 1 && n <= 25);
  return new Set(valid).size >= 15;
};

const sanitizeLine = (line: string): string => {
  // Extract label like "01)" or "Jogo 1:" if present at the start.
  const labelMatch = line.match(/^(\s*(?:jogo\s*)?\d{1,2}\s*[\)\.\-:])/i);
  const label = labelMatch ? labelMatch[1].trim() : '';

  const tokens = line.match(/\b\d{1,2}\b/g) || [];
  // Skip the leading label number when collecting actual game numbers.
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
    // Fill missing slots deterministically with smallest unused valid numbers
    for (let n = 1; n <= 25 && unique.length < 15; n++) {
      if (!unique.includes(n)) unique.push(n);
    }
  }
  const sorted = unique.sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const formatted = sorted.map((n) => String(n).padStart(2, '0')).join(', ');
  return `${label ? label + ' ' : ''}${formatted}  (soma ${sum})`;
};

/**
 * Walks the AI markdown output line-by-line. When a line looks like a
 * Lotofácil game suggestion, normalize it: dedupe, clamp to range, sort,
 * recompute the sum. Keeps non-game text intact.
 */
export const sanitizeAiGames = (content: string): string => {
  if (!content) return content;
  const lines = content.split('\n');
  return lines
    .map((line) => (isGameLineCandidate(line) ? sanitizeLine(line) : line))
    .join('\n');
};
