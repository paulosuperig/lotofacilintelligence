import { describe, it, expect } from 'vitest';
import {
  formatInlinePlain,
  gameStatsLine,
  buildSingleGameMessage,
  buildHistoryMessage,
  buildHistoryPlain,
} from './whatsapp';
import { computeGameMetrics } from '@/lib/lottery/metrics';
import type { SavedGame } from '@/types/lottery';

const GAME = [5, 1, 10, 2, 8, 25, 11, 13, 14, 17, 20, 21, 22, 23, 24];
const GAME_SORTED = [1, 2, 5, 8, 10, 11, 13, 14, 17, 20, 21, 22, 23, 24, 25];

const savedGame = (numbers: number[], i: number): SavedGame => ({
  id: `id-${i}`,
  numbers,
  timestamp: 1_700_000_000_000 + i,
});

describe('formatInlinePlain', () => {
  it('coloca as 15 dezenas em uma única linha, ordenadas, sem markdown', () => {
    const out = formatInlinePlain(GAME);
    expect(out).toBe('01 02 05 08 10 11 13 14 17 20 21 22 23 24 25');
    expect(out).not.toMatch(/\n/); // uma única linha
    expect(out).not.toMatch(/[*`_-]/); // texto puro, copiável
  });
});

describe('gameStatsLine', () => {
  it('reflete computeGameMetrics (soma/pares/ímpares)', () => {
    const m = computeGameMetrics(GAME);
    const line = gameStatsLine(GAME);
    expect(line).toContain(`Soma ${m.soma}`);
    expect(line).toContain(`${m.pares} pares`);
    expect(line).toContain(`${m.impares} ímpares`);
  });
});

describe('buildSingleGameMessage', () => {
  const msg = buildSingleGameMessage(GAME);

  it('não usa mais bloco monospace nem o separador antigo " - "', () => {
    expect(msg).not.toContain('```');
    expect(msg).not.toContain(' - ');
  });

  it('tem as dezenas em uma única linha de texto puro', () => {
    expect(msg).toContain('01 02 05 08 10 11 13 14 17 20 21 22 23 24 25');
  });

  it('cabeçalho em negrito e todas as 15 dezenas presentes', () => {
    expect(msg).toContain('*LOTOFÁCIL INTELLIGENCE*');
    for (const n of GAME_SORTED) expect(msg).toContain(n.toString().padStart(2, '0'));
  });
});

describe('buildHistoryMessage', () => {
  it('retorna string vazia para histórico vazio', () => {
    expect(buildHistoryMessage([])).toBe('');
  });

  it('coloca cada jogo em uma única linha (NN) ...), sem monospace', () => {
    const history = [savedGame(GAME, 0), savedGame([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 1)];
    const msg = buildHistoryMessage(history);
    expect(msg).not.toContain('```');
    expect(msg).toContain('Histórico · 2 jogos');
    expect(msg).toContain('01) 01 02 05 08 10 11 13 14 17 20 21 22 23 24 25');
    expect(msg).toContain('02) 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15');
    // cada jogo é exatamente uma linha
    const jogoLines = msg.split('\n').filter((l) => /^\d{2}\)/.test(l));
    expect(jogoLines).toHaveLength(2);
  });
});

describe('buildHistoryPlain', () => {
  it('números puros, um jogo por linha, sem rótulo/markdown/emoji', () => {
    const history = [savedGame(GAME, 0), savedGame(GAME_SORTED, 1)];
    const plain = buildHistoryPlain(history);
    const lines = plain.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('01 02 05 08 10 11 13 14 17 20 21 22 23 24 25');
    expect(plain).not.toMatch(/[*`_)]/);
    expect(plain).not.toContain('🍀');
  });

  it('vazio para histórico vazio', () => {
    expect(buildHistoryPlain([])).toBe('');
  });
});
