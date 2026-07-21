import { describe, it, expect } from 'vitest';
import { checkGame, checkGames } from './checker';

describe('checkGame', () => {
  const draw = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  it('counts full match (15 hits)', () => {
    const r = checkGame(draw, draw);
    expect(r.hits).toBe(15);
    expect(r.tier).toBe(15);
    expect(r.awarded).toBe(true);
    expect(r.missed).toEqual([]);
  });

  it('counts partial matches and misses', () => {
    const game = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 20, 21, 22, 23];
    const r = checkGame(game, draw);
    expect(r.hits).toBe(11);
    expect(r.tier).toBe(11);
    expect(r.awarded).toBe(true);
    expect(r.matched).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(r.missed).toEqual([20, 21, 22, 23]);
  });

  it('is not awarded below 11 hits', () => {
    const game = [1, 2, 3, 4, 5, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
    const r = checkGame(game, draw);
    expect(r.hits).toBe(5);
    expect(r.tier).toBeNull();
    expect(r.awarded).toBe(false);
  });

  it('accepts string inputs (as APIs return)', () => {
    const r = checkGame(['01', '02', '03'], ['01', '02', '99']);
    expect(r.hits).toBe(2);
  });
});

describe('checkGames', () => {
  const draw = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  it('aggregates a summary', () => {
    const games = [
      draw, // 15
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 20, 21, 22, 23], // 11
      [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 1, 2, 3, 4, 5], // 5
    ];
    const s = checkGames(games, draw);
    expect(s.total).toBe(3);
    expect(s.premiados).toBe(2);
    expect(s.melhorAcerto).toBe(15);
    expect(s.distribuicao[15]).toBe(1);
    expect(s.distribuicao[11]).toBe(1);
    expect(s.distribuicao[5]).toBe(1);
  });

  it('handles empty list', () => {
    const s = checkGames([], draw);
    expect(s.total).toBe(0);
    expect(s.premiados).toBe(0);
    expect(s.melhorAcerto).toBe(0);
  });
});
