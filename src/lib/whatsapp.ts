import { SavedGame } from '@/types/lottery';
import { computeGameMetrics } from '@/lib/lottery/metrics';

const APP_NAME = '🍀 *LOTOFÁCIL INTELLIGENCE*';

const pad = (n: number) => n.toString().padStart(2, '0');

const sortAsc = (numbers: number[]) => [...numbers].sort((a, b) => a - b);

/**
 * Dezenas de um jogo em UMA ÚNICA LINHA de texto simples, separadas por espaço
 * e com padStart(2). Texto puro (sem markdown/monospace) → selecionável e
 * copiável no WhatsApp, sem o bloco ``` que quebrava o jogo em duas linhas.
 */
export const formatInlinePlain = (numbers: number[]): string =>
  sortAsc(numbers).map(pad).join(' ');

/** Linha de estatísticas do jogo, reutilizando computeGameMetrics. */
export const gameStatsLine = (numbers: number[]): string => {
  const m = computeGameMetrics(numbers);
  return `Soma ${m.soma} · ${m.pares} pares / ${m.impares} ímpares`;
};

const getOrigin = (): string =>
  typeof window !== 'undefined' ? window.location.origin : '';

/**
 * Mensagem de UM jogo para o WhatsApp: cabeçalho + as 15 dezenas em uma única
 * linha copiável + linha de estatísticas em itálico.
 */
export const buildSingleGameMessage = (numbers: number[]): string => {
  const origin = getOrigin();
  const lines = [
    APP_NAME,
    'Meu jogo:',
    formatInlinePlain(numbers),
    `_${gameStatsLine(numbers)}_`,
    '',
    'Boa sorte! 🍀',
  ];
  if (origin) lines.push(origin);
  return lines.join('\n');
};

/**
 * Mensagem do histórico para o WhatsApp: cada jogo em UMA ÚNICA LINHA
 * (`NN) 01 02 ...`), em texto puro para facilitar a cópia.
 */
export const buildHistoryMessage = (history: SavedGame[]): string => {
  if (history.length === 0) return '';

  const origin = getOrigin();
  const header = [
    APP_NAME,
    `*Histórico · ${history.length} ${history.length === 1 ? 'jogo' : 'jogos'}*`,
    '',
  ];

  const gameLines = history.map(
    (item, idx) => `${pad(idx + 1)}) ${formatInlinePlain(item.numbers)}`,
  );

  const footer = ['', 'Boa sorte! 🍀'];
  if (origin) footer.push(origin);

  return [...header, ...gameLines, ...footer].join('\n');
};

/**
 * Versão em TEXTO PURO do histórico (sem cabeçalho, markdown ou emoji), ideal
 * para o botão "Copiar Tudo" — cola limpo no volante/app da Caixa, um jogo por
 * linha.
 */
export const buildHistoryPlain = (history: SavedGame[]): string => {
  if (history.length === 0) return '';
  return history.map((item) => formatInlinePlain(item.numbers)).join('\n');
};

export const openWhatsApp = (text: string) => {
  if (!text) return;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};
