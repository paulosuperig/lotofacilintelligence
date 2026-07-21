import { SavedGame } from '@/types/lottery';
import { computeGameMetrics } from '@/lib/lottery/metrics';

const APP_NAME = '🍀 *LOTOFÁCIL INTELLIGENCE*';

const pad = (n: number) => n.toString().padStart(2, '0');

const sortAsc = (numbers: number[]) => [...numbers].sort((a, b) => a - b);

/** Dezenas em texto puro, separadas por espaço simples (para cópia/colar). */
export const formatInlinePlain = (numbers: number[]): string =>
  sortAsc(numbers).map(pad).join(' ');

/**
 * Grade monospace 3×5 (```). O bloco monospace do WhatsApp preserva o
 * alinhamento das colunas e as linhas curtas (5 dezenas) não quebram no celular.
 * Dezenas com padStart(2) e 2 espaços entre colunas.
 */
export const formatGrid = (numbers: number[]): string => {
  const nums = sortAsc(numbers).map(pad);
  const rows: string[] = [];
  for (let i = 0; i < nums.length; i += 5) {
    rows.push(nums.slice(i, i + 5).join('  '));
  }
  return ['```', ...rows, '```'].join('\n');
};

/** Linha de estatísticas do jogo, reutilizando computeGameMetrics. */
export const gameStatsLine = (numbers: number[]): string => {
  const m = computeGameMetrics(numbers);
  return `Soma ${m.soma} · ${m.pares} pares / ${m.impares} ímpares`;
};

const getOrigin = (): string =>
  typeof window !== 'undefined' ? window.location.origin : '';

/**
 * Mensagem de UM jogo para o WhatsApp: cabeçalho em negrito, grade monospace
 * alinhada (sem quebras) e linha de estatísticas em itálico.
 */
export const buildSingleGameMessage = (numbers: number[]): string => {
  const origin = getOrigin();
  const lines = [
    APP_NAME,
    'Meu jogo:',
    '',
    formatGrid(numbers),
    `_${gameStatsLine(numbers)}_`,
    '',
    'Boa sorte! 🍀',
  ];
  if (origin) lines.push(origin);
  return lines.join('\n');
};

/**
 * Mensagem do histórico completo para o WhatsApp: um único bloco monospace com
 * uma linha compacta por jogo (`NN) 01 02 ...`), mantendo o alinhamento.
 */
export const buildHistoryMessage = (history: SavedGame[]): string => {
  if (history.length === 0) return '';

  const origin = getOrigin();
  const header = [
    APP_NAME,
    `*Histórico · ${history.length} ${history.length === 1 ? 'jogo' : 'jogos'}*`,
    '',
  ];

  const gameLines = history.map((item, idx) => {
    const index = pad(idx + 1);
    return `${index}) ${formatInlinePlain(item.numbers)}`;
  });
  const block = ['```', ...gameLines, '```'];

  const footer = ['', 'Boa sorte! 🍀'];
  if (origin) footer.push(origin);

  return [...header, ...block, ...footer].join('\n');
};

/**
 * Versão em TEXTO PURO do histórico (sem markdown nem emoji), ideal para o
 * botão "Copiar Tudo" — cola limpo no volante/app da Caixa.
 */
export const buildHistoryPlain = (history: SavedGame[]): string => {
  if (history.length === 0) return '';
  return history
    .map((item, idx) => `${pad(idx + 1)}) ${formatInlinePlain(item.numbers)}`)
    .join('\n');
};

export const openWhatsApp = (text: string) => {
  if (!text) return;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};
