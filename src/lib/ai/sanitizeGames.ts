// Post-processing of AI assistant output to guarantee mathematically valid
// Lotofácil game lines (15 unique numbers in [1,25], sorted, with correct sum)
// and to append an AUTHORITATIVE, system-computed validation of every game —
// so the conference shown to the user reflects real metrics, not the model's
// self-report.

import { computeGameMetrics } from '@/lib/lottery/metrics';
import { BANDS } from '@/lib/lottery/constants';
import { extractGameFromLine } from './extractGames';

export type EstrategiaJogo =
  | 'quentes'
  | 'atrasadas'
  | 'equilibrada'
  | 'agressiva'
  | 'repetidas'
  | 'ciclo';

export interface UserIntent {
  quantidade?: number;
  somaMin?: number;
  somaMax?: number;
  /** estratégia preferida pelo usuário, quando detectada na mensagem */
  estrategia?: EstrategiaJogo;
  /** dezenas que DEVEM aparecer em todos os jogos (fixadas pelo usuário) */
  incluirDezenas?: number[];
  /** dezenas que NÃO PODEM aparecer em nenhum jogo (excluídas pelo usuário) */
  excluirDezenas?: number[];
}

export const INCOMPLETE_MARKER = '⚠️ Resposta incompleta';

/** Uma linha é candidata a jogo apenas se contiver 15+ dezenas válidas distintas. */
const isGameLineCandidate = (line: string): boolean =>
  extractGameFromLine(line) !== null;

/**
 * Sanitiza a linha de um jogo a partir das 15 dezenas REAIS extraídas
 * (ordenadas, únicas). NÃO fabrica dezenas: se a linha não tiver 15 válidas,
 * `extractGameFromLine` já teria retornado null e nem chegaríamos aqui.
 */
const formatGameLine = (nums: number[]): string => {
  const sum = nums.reduce((a, b) => a + b, 0);
  const formatted = nums.map((n) => String(n).padStart(2, '0')).join(', ');
  return `${formatted}  (soma ${sum})`;
};

interface GameCheck {
  index: number;
  nums: number[];
  soma: number;
  pares: number;
  impares: number;
  primos: number;
  moldura: number;
  miolo: number;
  sequencia: number;
  repetidas: number | null;
  /** critérios (labels) fora da faixa saudável/ideal ou do filtro do usuário */
  violations: string[];
}

const inIdeal = (v: number, key: keyof typeof BANDS) =>
  v >= BANDS[key].idealMin && v <= BANDS[key].idealMax;

/** Avalia um jogo contra as faixas saudáveis e o filtro de soma do usuário. */
const checkGame = (
  index: number,
  nums: number[],
  intent: UserIntent | undefined,
  previousDraw: number[] | undefined,
): GameCheck => {
  const m = computeGameMetrics(nums, previousDraw ?? null);
  const violations: string[] = [];

  if (!inIdeal(m.soma, 'soma')) violations.push('soma');
  if (!inIdeal(m.pares, 'pares')) violations.push('par/ímpar');
  if (!inIdeal(m.primos, 'primos')) violations.push('primos');
  if (!inIdeal(m.moldura, 'moldura')) violations.push('moldura');
  if (!inIdeal(m.miolo, 'miolo')) violations.push('miolo');
  if (m.sequencia > BANDS.sequencia.idealMax) violations.push('sequência');
  if (m.repetidas != null && !inIdeal(m.repetidas, 'repetidas')) violations.push('repetidas');

  if (intent?.somaMin != null && m.soma < intent.somaMin) violations.push('soma < filtro');
  if (intent?.somaMax != null && m.soma > intent.somaMax) violations.push('soma > filtro');

  // Restrições explícitas do usuário: fixas ausentes ou excluídas presentes.
  if (intent?.incluirDezenas?.some((n) => !nums.includes(n))) violations.push('fixadas ausentes');
  if (intent?.excluirDezenas?.some((n) => nums.includes(n))) violations.push('contém excluídas');

  return {
    index,
    nums,
    soma: m.soma,
    pares: m.pares,
    impares: m.impares,
    primos: m.primos,
    moldura: m.moldura,
    miolo: m.miolo,
    sequencia: m.sequencia,
    repetidas: m.repetidas,
    violations,
  };
};

/** Marca uma célula com ⚠️ quando o valor viola a faixa, mantendo o número legível. */
const cell = (value: string | number, bad: boolean) => (bad ? `${value} ⚠️` : `${value}`);

/**
 * Monta a "Conferência automática" — uma tabela com métricas REAIS por jogo.
 * Os números da tabela são pequenos (1..25), mas cada linha tem <15 dezenas
 * distintas, então NÃO é confundida com um jogo por `extractGamesFromText`.
 */
const buildConference = (checks: GameCheck[]): string => {
  const hasRep = checks.some((c) => c.repetidas != null);
  const header = hasRep
    ? '| Jogo | Soma | P/Í | Primos | Moldura | Miolo | Seq | Rep | Status |'
    : '| Jogo | Soma | P/Í | Primos | Moldura | Miolo | Seq | Status |';
  const sep = hasRep
    ? '|---|---|---|---|---|---|---|---|---|'
    : '|---|---|---|---|---|---|---|---|';

  const rows = checks.map((c) => {
    const bad = (label: string) => c.violations.includes(label);
    const soma = cell(c.soma, bad('soma') || bad('soma < filtro') || bad('soma > filtro'));
    const pi = cell(`${c.pares}/${c.impares}`, bad('par/ímpar'));
    const primos = cell(c.primos, bad('primos'));
    const mold = cell(c.moldura, bad('moldura'));
    const miolo = cell(c.miolo, bad('miolo'));
    const seq = cell(c.sequencia, bad('sequência'));
    const status = c.violations.length === 0 ? '✅' : '⚠️';
    const rep = c.repetidas != null ? cell(c.repetidas, bad('repetidas')) : '—';
    return hasRep
      ? `| ${c.index} | ${soma} | ${pi} | ${primos} | ${mold} | ${miolo} | ${seq} | ${rep} | ${status} |`
      : `| ${c.index} | ${soma} | ${pi} | ${primos} | ${mold} | ${miolo} | ${seq} | ${status} |`;
  });

  const healthy = checks.filter((c) => c.violations.length === 0).length;
  const footer =
    healthy === checks.length
      ? `> ✅ Conferência do sistema: **${healthy}/${checks.length}** jogos dentro de todas as faixas saudáveis.`
      : `> ⚠️ Conferência do sistema: **${healthy}/${checks.length}** jogos plenamente saudáveis; ⚠️ marca a métrica fora da faixa de referência.`;

  return ['### 🧪 Conferência automática (sistema)', header, sep, ...rows, '', footer].join('\n');
};

export interface SanitizeResult {
  content: string;
  gamesFound: number;
  outOfRangeSums: number;
  incomplete: boolean;
  /** jogos que violam ao menos uma faixa saudável ou o filtro do usuário */
  unhealthy: number;
}

export const sanitizeAiGamesDetailed = (
  content: string,
  intent?: UserIntent,
  previousDraw?: number[],
): SanitizeResult => {
  if (!content) {
    return { content, gamesFound: 0, outOfRangeSums: 0, incomplete: false, unhealthy: 0 };
  }
  const lines = content.split('\n');
  const checks: GameCheck[] = [];

  const out = lines.map((line) => {
    if (!isGameLineCandidate(line)) return line;
    // Fonte da verdade das dezenas: mesmo parser usado para extrair/salvar jogos.
    const nums = extractGameFromLine(line)!;
    const check = checkGame(checks.length + 1, nums, intent, previousDraw);
    checks.push(check);
    // Jogo fica LIMPO dentro do code block (só dezenas + soma de 3 dígitos),
    // para não poluir a extração de dezenas na UI. As ressalvas vão na tabela.
    return '```\n' + formatGameLine(nums) + '\n```';
  });

  let body = out.join('\n');
  const gamesFound = checks.length;
  const outOfRangeSums = checks.filter((c) =>
    c.violations.includes('soma < filtro') || c.violations.includes('soma > filtro'),
  ).length;
  const unhealthy = checks.filter((c) => c.violations.length > 0).length;

  if (gamesFound > 0) {
    body += `\n\n${buildConference(checks)}`;
  }

  let incomplete = false;
  const expected = intent?.quantidade;
  if (expected && gamesFound < expected) {
    incomplete = true;
    body += `\n\n> ${INCOMPLETE_MARKER}: foram entregues **${gamesFound} de ${expected}** jogos solicitados. Use o botão "Regenerar resposta completa" abaixo.`;
  }
  if (outOfRangeSums > 0) {
    body += `\n\n> ⚠️ ${outOfRangeSums} jogo(s) ficaram fora do filtro de soma solicitado.`;
  }
  const semFixadas = checks.filter((c) => c.violations.includes('fixadas ausentes')).length;
  if (semFixadas > 0) {
    body += `\n\n> ⚠️ ${semFixadas} jogo(s) não contêm todas as dezenas fixadas no pedido.`;
  }
  const comExcluidas = checks.filter((c) => c.violations.includes('contém excluídas')).length;
  if (comExcluidas > 0) {
    body += `\n\n> ⚠️ ${comExcluidas} jogo(s) contêm dezenas excluídas no pedido.`;
  }

  return { content: body, gamesFound, outOfRangeSums, incomplete, unhealthy };
};

/** Backward-compatible wrapper. */
export const sanitizeAiGames = (content: string, intent?: UserIntent): string =>
  sanitizeAiGamesDetailed(content, intent).content;
