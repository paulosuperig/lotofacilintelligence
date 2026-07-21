import { describe, it, expect } from 'vitest';
import { generateWheel, verifyWheelGuarantee, combinationMasks } from './wheel';
import { seededRng } from './generator';

const isValidGame = (g: number[], pool: number[]) => {
  expect(g).toHaveLength(15);
  expect(new Set(g).size).toBe(15);
  for (const n of g) expect(pool).toContain(n);
  expect([...g].sort((a, b) => a - b)).toEqual(g);
};

describe('combinationMasks', () => {
  it('counts combinations correctly', () => {
    expect(combinationMasks(16, 15).length).toBe(16); // C(16,15)
    expect(combinationMasks(18, 15).length).toBe(816); // C(18,15)
    expect(combinationMasks(5, 0)).toEqual([0]);
    expect(combinationMasks(3, 5)).toEqual([]);
  });
});

describe('generateWheel', () => {
  const pool16 = Array.from({ length: 16 }, (_, i) => i + 1); // 1..16

  it('generates valid distinct games within the pool', () => {
    const w = generateWheel({ pool: pool16, numGames: 6, rng: seededRng(1) });
    expect(w.games.length).toBe(6);
    const sigs = new Set(w.games.map((g) => g.join(',')));
    expect(sigs.size).toBe(6);
    w.games.forEach((g) => isValidGame(g, w.pool));
  });

  it('guarantees 14 points for a 16-number pool (mathematical fact)', () => {
    // Com N=16, cada jogo exclui 1 dezena; qualquer sorteio dentro do pool
    // acerta 14 num jogo que não exclua a dezena de fora → garantia 14.
    const w = generateWheel({ pool: pool16, numGames: 6, rng: seededRng(3) });
    expect(w.guarantee).toBe(14);
  });

  it('guarantees 15 when all possible games are included', () => {
    const w = generateWheel({ pool: pool16, numGames: 16, rng: seededRng(5) });
    expect(w.numGames).toBe(16);
    expect(w.guarantee).toBe(15);
  });

  it('verified guarantee matches the reported guarantee', () => {
    const w = generateWheel({ pool: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], numGames: 10, rng: seededRng(9) });
    const verified = verifyWheelGuarantee(w.games, w.pool);
    expect(verified).toBe(w.guarantee);
    expect(w.guarantee).toBeGreaterThanOrEqual(13); // garantia real e útil
    w.games.forEach((g) => isValidGame(g, w.pool));
  });

  it('more games never reduce the guarantee', () => {
    const few = generateWheel({ pool: pool16, numGames: 3, rng: seededRng(7) });
    const many = generateWheel({ pool: pool16, numGames: 12, rng: seededRng(7) });
    expect(many.guarantee).toBeGreaterThanOrEqual(few.guarantee);
  });

  it('handles insufficient pool gracefully', () => {
    const w = generateWheel({ pool: [1, 2, 3], numGames: 5 });
    expect(w.games.length).toBe(0);
    expect(w.guarantee).toBe(0);
  });
});
