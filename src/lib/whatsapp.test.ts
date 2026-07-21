import { describe, it, expect } from 'vitest';
import {
  formatInlinePlain,
  formatGrid,
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
  it('ordena e usa padStart(2) com espaço simples, sem markdown', () => {
    const out = formatInlinePlain(GAME);
    expect(out).toBe('01 02 05 08 10 11 13 14 17 20 21 22 23 24 25');
    expect(out).not.toMatch(/[*`_-]/);
  });
});

describe('formatGrid', () => {
  it('produz grade monospace 3×5 dentro de cercas ```', () => {
    const grid = formatGrid(GAME);
    const lines = grid.split('\n');
    expect(lines[0]).toBe('```');
    expect(lines[lines.length - 1]).toBe('```');
    const rows = lines.slice(1, -1);
    expect(rows).toHaveLength(3); // 15 dezenas / 5
    rows.forEach((r) => expect(r.trim().split(/\s+/)).toHaveLength(5));
    // ordenado: primeira dezena é 01
    expect(rows[0].startsWith('01')).toBe(true);
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

  it('tem cabeçalho em negrito e grade monospace, sem o separador antigo " - "', () => {
    expect(msg).toContain('*LOTOFÁCIL INTELLIGENCE*');
    expect(msg).toContain('```');
    expect(msg).not.toContain(' - ');
  });

  it('contém todas as 15 dezenas ordenadas', () => {
    for (const n of GAME_SORTED) {
      expect(msg).toContain(n.toString().padStart(2, '0'));
    }
  });

  it('nenhuma linha da grade excede 5 dezenas (evita quebra)', () => {
    const grid = msg.split('```')[1];
    grid.trim().split('\n').forEach((r) => {
      expect(r.trim().split(/\s+/).length).toBeLessThanOrEqual(5);
    });
  });
});

describe('buildHistoryMessage', () => {
  it('retorna string vazia para histórico vazio', () => {
    expect(buildHistoryMessage([])).toBe('');
  });

  it('numera os jogos e usa bloco monospace', () => {
    const history = [savedGame(GAME, 0), savedGame([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 1)];
    const msg = buildHistoryMessage(history);
    expect(msg).toContain('Histórico · 2 jogos');
    expect(msg).toContain('01) 01 02 05');
    expect(msg).toContain('02) 01 02 03');
    expect(msg).toContain('```');
  });
});

describe('buildHistoryPlain', () => {
  it('não contém markdown nem emoji (cópia limpa)', () => {
    const history = [savedGame(GAME, 0)];
    const plain = buildHistoryPlain(history);
    expect(plain).toBe('01) 01 02 05 08 10 11 13 14 17 20 21 22 23 24 25');
    expect(plain).not.toMatch(/[*`_]/);
    expect(plain).not.toMatch(/🍀/);
  });

  it('vazio para histórico vazio', () => {
    expect(buildHistoryPlain([])).toBe('');
  });
});
