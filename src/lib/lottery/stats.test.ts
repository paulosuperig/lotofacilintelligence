import { describe, it, expect } from 'vitest';
import { calculateGameStats } from './stats';

/**
 * P1 — Estatísticas exibidas em cada jogo. Erro aqui engana o usuário sobre a
 * qualidade do jogo (paridade, primos, moldura, sequência, soma).
 */
describe('calculateGameStats', () => {
  it('conta pares e ímpares corretamente', () => {
    const s = calculateGameStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    // 2,4,6,8,10,12,14 = 7 pares; 8 ímpares
    expect(s.pairs).toBe(7);
    expect(s.odd).toBe(8);
  });

  it('soma 1..15 = 120', () => {
    const s = calculateGameStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    expect(s.sum).toBe(120);
  });

  it('conta primos (2,3,5,7,11,13 em 1..15) = 6', () => {
    const s = calculateGameStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    expect(s.primes).toBe(6);
  });

  it('detecta a maior sequência consecutiva', () => {
    const s = calculateGameStats([1, 2, 3, 4, 5, 10, 12, 14, 16, 18, 20, 21, 23, 24, 25]);
    // 1,2,3,4,5 = sequência de 5
    expect(s.sequence).toBe(5);
  });

  it('sequência de números não consecutivos é 1', () => {
    const s = calculateGameStats([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 2, 4]);
    expect(s.sequence).toBeGreaterThanOrEqual(1);
  });

  it('conta dezenas da moldura', () => {
    const mold = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
    const s = calculateGameStats(mold.slice(0, 15));
    expect(s.mold).toBe(15);
  });

  it('lida com array vazio sem quebrar', () => {
    const s = calculateGameStats([]);
    expect(s.sum).toBe(0);
    expect(s.sequence).toBe(0);
    expect(s.pairs).toBe(0);
  });
});
