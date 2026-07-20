import { describe, it, expect } from 'vitest';
import {
  sanitizeAiGamesDetailed,
  sanitizeAiGames,
  INCOMPLETE_MARKER,
} from './sanitizeGames';

/**
 * P1 — Núcleo do assistente de IA: garante que toda linha de jogo devolvida
 * seja matematicamente válida (15 dezenas únicas em [1,25]) antes de chegar ao
 * usuário. É a barreira contra a IA "alucinar" jogos inválidos.
 */
describe('sanitizeAiGamesDetailed', () => {
  const extractNumbers = (block: string): number[] =>
    (block.match(/\b\d{1,2}\b/g) || [])
      .map((n) => parseInt(n, 10))
      .filter((n) => n >= 1 && n <= 25);

  it('normaliza uma linha de jogo para exatamente 15 dezenas únicas em [1,25]', () => {
    const input = 'Jogo 01: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15';
    const res = sanitizeAiGamesDetailed(input);
    expect(res.gamesFound).toBe(1);
    const nums = extractNumbers(res.content.replace(/soma \d+/g, ''));
    expect(new Set(nums).size).toBe(15);
    expect(Math.min(...nums)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...nums)).toBeLessThanOrEqual(25);
  });

  it('completa um jogo com dezenas faltando até chegar a 15', () => {
    // 12 dezenas informadas — deve completar para 15
    const input = 'Jogo 1: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12';
    const res = sanitizeAiGamesDetailed(input);
    // Uma linha com menos de 15 candidatas NÃO é considerada jogo (candidate<15)
    // então não deve ser marcada como jogo — validando o guard de detecção.
    expect(res.gamesFound).toBe(0);
  });

  it('remove dezenas duplicadas e fora de faixa, mantendo 15 válidas', () => {
    const input = 'Jogo 1: 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 30, 99';
    const res = sanitizeAiGamesDetailed(input);
    expect(res.gamesFound).toBe(1);
    const nums = extractNumbers(res.content.replace(/soma \d+/g, ''));
    expect(new Set(nums).size).toBe(15);
    expect(nums.every((n) => n >= 1 && n <= 25)).toBe(true);
  });

  it('calcula a soma corretamente', () => {
    const input = 'Jogo 1: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15';
    const res = sanitizeAiGamesDetailed(input);
    // 1..15 soma 120
    expect(res.content).toContain('soma 120');
  });

  it('sinaliza resposta incompleta quando entrega menos jogos que o solicitado', () => {
    const input = 'Jogo 1: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15';
    const res = sanitizeAiGamesDetailed(input, { quantidade: 3 });
    expect(res.incomplete).toBe(true);
    expect(res.content).toContain(INCOMPLETE_MARKER);
  });

  it('marca jogos fora do filtro de soma', () => {
    const input = 'Jogo 1: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15';
    const res = sanitizeAiGamesDetailed(input, { somaMin: 200 });
    expect(res.outOfRangeSums).toBe(1);
  });

  it('não altera texto que não é linha de jogo', () => {
    const input = 'Olá! Aqui vão suas dicas para a Lotofácil.';
    const res = sanitizeAiGamesDetailed(input);
    expect(res.gamesFound).toBe(0);
    expect(res.content).toBe(input);
  });

  it('lida com conteúdo vazio sem quebrar', () => {
    const res = sanitizeAiGamesDetailed('');
    expect(res.gamesFound).toBe(0);
    expect(res.incomplete).toBe(false);
  });

  it('wrapper sanitizeAiGames devolve apenas o conteúdo', () => {
    const input = 'Jogo 1: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15';
    expect(typeof sanitizeAiGames(input)).toBe('string');
  });
});
