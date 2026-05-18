import { SavedGame } from '@/types/lottery';

const formatNumbers = (numbers: number[]): string =>
  numbers.map(n => n.toString().padStart(2, '0')).join(' - ');

const formatDate = (timestamp: number): string =>
  new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

/**
 * Build a single-game WhatsApp message.
 * Uses plain text + WhatsApp markdown (*bold*) and avoids decorative emojis
 * to prevent rendering issues across devices/fonts.
 */
export const buildSingleGameMessage = (numbers: number[]): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const lines = [
    '*LOTOFACIL INTELLIGENCE*',
    'Jogo gerado:',
    '',
    `*${formatNumbers(numbers)}*`,
    '',
    'Boa sorte!',
  ];
  if (origin) lines.push(`Gerado em: ${origin}`);
  return lines.join('\n');
};

/**
 * Build a full-history WhatsApp message with a clean, numbered list.
 */
export const buildHistoryMessage = (history: SavedGame[]): string => {
  if (history.length === 0) return '';

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const header = [
    '*LOTOFACIL INTELLIGENCE*',
    '*Historico de Jogos*',
    `Total: ${history.length} ${history.length === 1 ? 'jogo' : 'jogos'}`,
    '',
  ];

  const body = history.map((item, idx) => {
    const index = (idx + 1).toString().padStart(2, '0');
    return `${index}. [${formatDate(item.timestamp)}] ${formatNumbers(item.numbers)}`;
  });

  const footer = ['', 'Boa sorte!'];
  if (origin) footer.push(`Gerado em: ${origin}`);

  return [...header, ...body, ...footer].join('\n');
};

export const openWhatsApp = (text: string) => {
  if (!text) return;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};
