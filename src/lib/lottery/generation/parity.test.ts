import { describe, expect, it } from 'vitest';
import type { HistoryAnalysis } from '../analysis';
import * as facade from '../generator';
import { generateOptimizedGame } from './optimize';
import { generateBatch } from './batch';
import { seededRng } from './rng';

// Valores capturados do gerador ANTES da divisão em módulos (27/10/2026).
// Mesma semente deve continuar produzindo exatamente os mesmos jogos.
const prev = [1, 2, 3, 5, 7, 9, 10, 11, 13, 15, 17, 19, 21, 23, 25];
const analysis = {
  totalConcursos: 10,
  ranking: Array.from({ length: 25 }, (_, i) => ({
    numero: i + 1,
    frequencia: ((i * 7) % 11) + 1,
    atraso: (i * 3) % 5,
  })),
} as unknown as HistoryAnalysis;
const constrained = { analysis, previousDraw: prev, fixed: [4], excluded: [6], sumMin: 180, sumMax: 210 };

describe('paridade do gerador dividido', () => {
  it('estratégia quentes com semente 42 gera o mesmo jogo de antes', () => {
    const game = generateOptimizedGame({ ...constrained, rng: seededRng(42), strategy: 'quentes' });
    expect(game.numbers).toEqual([2, 3, 4, 5, 8, 9, 10, 13, 14, 15, 18, 20, 21, 23, 24]);
  });

  it('surpresinha com semente 42 gera o mesmo jogo de antes', () => {
    const game = generateOptimizedGame({ ...constrained, rng: seededRng(42), strategy: 'surpresinha' });
    expect(game.numbers).toEqual([4, 5, 7, 8, 9, 11, 12, 14, 16, 17, 18, 20, 22, 23, 24]);
  });

  it('jogo sem histórico com semente 1 gera o mesmo jogo de antes', () => {
    expect(generateOptimizedGame({ rng: seededRng(1) }).numbers).toEqual([
      1, 3, 5, 7, 8, 9, 10, 11, 14, 15, 16, 18, 23, 24, 25,
    ]);
  });

  it('lote com semente 7 mantém o primeiro jogo de antes', () => {
    const batch = generateBatch({ count: 5, rng: seededRng(7), analysis, previousDraw: prev });
    expect(batch).toHaveLength(5);
    expect(batch[0].numbers).toEqual([3, 4, 6, 7, 8, 10, 11, 13, 14, 15, 16, 18, 19, 22, 25]);
  });

  it('a fachada antiga continua expondo as mesmas funções', () => {
    expect(facade.generateOptimizedGame).toBe(generateOptimizedGame);
    expect(facade.generateBatch).toBe(generateBatch);
    expect(facade.seededRng).toBe(seededRng);
  });
});
