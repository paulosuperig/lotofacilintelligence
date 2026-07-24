import { describe, it, expect } from 'vitest';
import { parseUserIntent, estrategiaDirective, formatIntentForPrompt, MAX_JOGOS } from './intent';

describe('parseUserIntent', () => {
  it('extrai quantidade numérica e por extenso', () => {
    expect(parseUserIntent('me gere 5 jogos').quantidade).toBe(5);
    expect(parseUserIntent('quero três jogos').quantidade).toBe(3);
  });

  it('extrai faixa de soma "entre X e Y"', () => {
    const i = parseUserIntent('jogos com soma entre 180 e 210');
    expect(i.somaMin).toBe(180);
    expect(i.somaMax).toBe(210);
  });

  it('extrai soma mínima e máxima abertas', () => {
    expect(parseUserIntent('soma acima de 190').somaMin).toBe(191);
    expect(parseUserIntent('soma maior ou igual a 190').somaMin).toBe(190);
    expect(parseUserIntent('soma abaixo de 200').somaMax).toBe(199);
  });

  it('detecta estratégias', () => {
    expect(parseUserIntent('foca nas dezenas quentes').estrategia).toBe('quentes');
    expect(parseUserIntent('quero as atrasadas').estrategia).toBe('atrasadas');
    expect(parseUserIntent('um jogo mais arriscado, uma zebra').estrategia).toBe('agressiva');
    expect(parseUserIntent('algo equilibrado e seguro').estrategia).toBe('equilibrada');
  });

  it('retorna vazio quando não há sinais', () => {
    expect(parseUserIntent('olá, tudo bem?')).toEqual({});
  });

  it('limita a quantidade ao teto (evita truncamento)', () => {
    expect(parseUserIntent('gere 30 jogos').quantidade).toBe(MAX_JOGOS);
    expect(parseUserIntent('quero 8 jogos').quantidade).toBe(8);
  });

  it('extrai dezenas fixas e excluídas', () => {
    const i = parseUserIntent('gere 4 jogos fixando as dezenas 05 e 10, sem a dezena 23');
    expect(i.incluirDezenas).toEqual([5, 10]);
    expect(i.excluirDezenas).toEqual([23]);
    expect(i.quantidade).toBe(4);
  });

  it('reconhece variações de inclusão/exclusão', () => {
    expect(parseUserIntent('inclua 01, 02 e 03 nos jogos').incluirDezenas).toEqual([1, 2, 3]);
    expect(parseUserIntent('excluindo 04 e 07').excluirDezenas).toEqual([4, 7]);
  });

  it('fixas têm precedência sobre excluídas em conflito', () => {
    const i = parseUserIntent('fixe 05 e 10, sem o 10');
    expect(i.incluirDezenas).toContain(10);
    expect(i.excluirDezenas).toBeUndefined();
  });

  it('detecta as novas estratégias (repetidas e ciclo)', () => {
    expect(parseUserIntent('priorize as dezenas repetidas do último concurso').estrategia).toBe('repetidas');
    expect(parseUserIntent('faça um fechamento de ciclo').estrategia).toBe('ciclo');
  });
});

describe('estrategiaDirective', () => {
  it('gera diretriz específica por estratégia', () => {
    expect(estrategiaDirective('quentes')).toContain('QUENTES');
    expect(estrategiaDirective('atrasadas')).toContain('ATRASADAS');
    expect(estrategiaDirective('agressiva')).toContain('AGRESSIVA');
    expect(estrategiaDirective('repetidas')).toContain('REPETIDAS');
    expect(estrategiaDirective('ciclo')).toContain('CICLO');
    // default cai em equilibrada
    expect(estrategiaDirective(undefined)).toContain('EQUILIBRADA');
  });
});

describe('formatIntentForPrompt', () => {
  it('inclui quantidade, soma e estratégia quando presentes', () => {
    const out = formatIntentForPrompt({ quantidade: 4, somaMin: 180, somaMax: 210, estrategia: 'quentes' });
    expect(out).toContain('Quantidade: 4');
    expect(out).toContain('Soma mínima: 180');
    expect(out).toContain('Soma máxima: 210');
    expect(out).toContain('Estratégia solicitada: quentes');
  });

  it('usa quantidade padrão 3', () => {
    expect(formatIntentForPrompt({})).toContain('Quantidade: 3');
  });

  it('inclui dezenas fixas e excluídas formatadas', () => {
    const out = formatIntentForPrompt({ incluirDezenas: [5, 10], excluirDezenas: [23] });
    expect(out).toContain('FIXAS');
    expect(out).toContain('05, 10');
    expect(out).toContain('EXCLUÍDAS');
    expect(out).toContain('23');
  });
});
