import { describe, it, expect } from 'vitest';
import {
  totalCotas,
  custoTotal,
  custoPorCota,
  custoDoCotista,
  ratearValor,
  conferirBolao,
  type Bolao,
  type Cotista,
} from './bolao';

const cotistas: Cotista[] = [
  { id: 'a', nome: 'Ana', cotas: 2 },
  { id: 'b', nome: 'Bruno', cotas: 1 },
  { id: 'c', nome: 'Célia', cotas: 1 },
];

const bolao: Bolao = {
  id: 'x',
  nome: 'Bolão do trabalho',
  precoPorJogo: 3,
  cotistas,
  jogos: [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16],
  ],
  createdAt: 0,
};

describe('custos do bolão', () => {
  it('totalCotas soma as cotas', () => {
    expect(totalCotas(bolao)).toBe(4);
  });
  it('custoTotal = jogos × preço', () => {
    expect(custoTotal(bolao)).toBe(6);
  });
  it('custoPorCota divide pelo total de cotas', () => {
    expect(custoPorCota(bolao)).toBe(1.5);
  });
  it('custoDoCotista proporcional às cotas', () => {
    expect(custoDoCotista(bolao, cotistas[0])).toBe(3); // Ana, 2 cotas
    expect(custoDoCotista(bolao, cotistas[1])).toBe(1.5); // Bruno, 1 cota
  });
  it('sem cotas, custo por cota é 0', () => {
    expect(custoPorCota({ ...bolao, cotistas: [] })).toBe(0);
  });
});

describe('ratearValor (maior resto, sem perder centavos)', () => {
  it('rateia proporcional às cotas', () => {
    const r = ratearValor(100, cotistas);
    expect(r.find((x) => x.cotistaId === 'a')?.valor).toBe(50);
    expect(r.find((x) => x.cotistaId === 'b')?.valor).toBe(25);
    expect(r.find((x) => x.cotistaId === 'c')?.valor).toBe(25);
  });
  it('a soma dos rateios é exatamente o total (sem sobrar centavo)', () => {
    const r = ratearValor(100, [
      { id: 'a', nome: 'A', cotas: 1 },
      { id: 'b', nome: 'B', cotas: 1 },
      { id: 'c', nome: 'C', cotas: 1 },
    ]);
    const soma = r.reduce((s, x) => s + x.valor, 0);
    expect(Math.round(soma * 100)).toBe(10000); // R$ 100,00 exatos
    // 100/3 → 33,34 + 33,33 + 33,33
    const valores = r.map((x) => x.valor).sort((a, b) => b - a);
    expect(valores).toEqual([33.34, 33.33, 33.33]);
  });
  it('total 0 → todos 0', () => {
    expect(ratearValor(0, cotistas).every((x) => x.valor === 0)).toBe(true);
  });
});

describe('conferirBolao', () => {
  it('confere jogos e rateia o prêmio total', () => {
    // sorteio = jogo 1 inteiro → jogo 1 faz 15, jogo 2 faz 14
    const draw = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const premiacoes = [
      { descricao: '15 acertos', ganhadores: 1, valorPremio: 1_000_000 },
      { descricao: '14 acertos', ganhadores: 10, valorPremio: 2_000 },
      { descricao: '13 acertos', valorPremio: 30 },
      { descricao: '12 acertos', valorPremio: 12 },
      { descricao: '11 acertos', valorPremio: 6 },
    ];
    const conf = conferirBolao(bolao, draw, premiacoes);
    expect(conf.porJogo[0].hits).toBe(15);
    expect(conf.porJogo[1].hits).toBe(14);
    expect(conf.melhorAcerto).toBe(15);
    expect(conf.premiados).toBe(2);
    expect(conf.totalPremio).toBe(1_002_000);
    // rateio: Ana 2/4 = 501.000, Bruno 1/4 = 250.500, Célia 250.500
    expect(conf.rateio.find((r) => r.cotistaId === 'a')?.valor).toBe(501_000);
    expect(conf.rateio.find((r) => r.cotistaId === 'b')?.valor).toBe(250_500);
  });

  it('sem prêmio quando nenhum jogo alcança 11 acertos', () => {
    const draw = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 1, 2, 3, 4, 5];
    const conf = conferirBolao(bolao, draw, []);
    expect(conf.totalPremio).toBe(0);
    expect(conf.rateio.every((r) => r.valor === 0)).toBe(true);
  });
});
