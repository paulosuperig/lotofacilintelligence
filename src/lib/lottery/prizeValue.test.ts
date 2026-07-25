import { describe, it, expect } from 'vitest';
import { acertosDaPremiacao, prizeForHits, formatBRL } from './prizeValue';

const PREMIACOES = [
  { descricao: '15 acertos', ganhadores: 2, valorPremio: 1_000_000 },
  { descricao: '14 acertos', ganhadores: 300, valorPremio: 1_500.5 },
  { descricao: '13 acertos', ganhadores: 9000, valorPremio: 30 },
  { descricao: '12 acertos', ganhadores: 120000, valorPremio: 12 },
  { descricao: '11 acertos', ganhadores: 600000, valorPremio: 6 },
];

describe('acertosDaPremiacao', () => {
  it('deduz pelo texto da descrição', () => {
    expect(acertosDaPremiacao({ descricao: '15 acertos' })).toBe(15);
    expect(acertosDaPremiacao({ descricao: '11 acertos' })).toBe(11);
  });
  it('deduz pela faixa (1=15 … 5=11)', () => {
    expect(acertosDaPremiacao({ faixa: 1 })).toBe(15);
    expect(acertosDaPremiacao({ faixa: 5 })).toBe(11);
  });
  it('retorna null para faixas fora de premiação', () => {
    expect(acertosDaPremiacao({ descricao: '10 acertos' })).toBeNull();
    expect(acertosDaPremiacao({})).toBeNull();
  });
});

describe('prizeForHits', () => {
  it('retorna o prêmio da faixa correta', () => {
    expect(prizeForHits(PREMIACOES, 15)).toEqual({ acertos: 15, ganhadores: 2, valor: 1_000_000 });
    expect(prizeForHits(PREMIACOES, 11)).toEqual({ acertos: 11, ganhadores: 600000, valor: 6 });
  });
  it('null para menos de 11 acertos', () => {
    expect(prizeForHits(PREMIACOES, 10)).toBeNull();
    expect(prizeForHits(PREMIACOES, 0)).toBeNull();
  });
  it('null quando premiacoes ausente', () => {
    expect(prizeForHits(undefined, 15)).toBeNull();
    expect(prizeForHits(null, 13)).toBeNull();
  });
  it('funciona com o formato por faixa', () => {
    const porFaixa = [{ faixa: 1, ganhadores: 1, valorPremio: 500000 }];
    expect(prizeForHits(porFaixa, 15)?.valor).toBe(500000);
  });
});

describe('formatBRL', () => {
  it('formata em reais', () => {
    expect(formatBRL(1500.5)).toContain('1.500,50');
    expect(formatBRL(null)).toBe('—');
  });
});
