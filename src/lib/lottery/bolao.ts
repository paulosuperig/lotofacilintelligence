/**
 * Bolão (gestão de grupo) da Lotofácil — lógica pura e testável.
 *
 * Um bolão reúne vários JOGOS e vários COTISTAS (cada um com um nº de cotas).
 * O custo é rateado por cota; um eventual prêmio é rateado por cota, na mesma
 * proporção. A conferência soma o prêmio de todos os jogos contra um concurso.
 */
import { checkGame } from './checker';
import { prizeForHits, type Premiacao } from './prizeValue';

export interface Cotista {
  id: string;
  nome: string;
  /** número de cotas do cotista (>= 0) */
  cotas: number;
}

export interface Bolao {
  id: string;
  nome: string;
  /** preço por jogo (aposta) em BRL */
  precoPorJogo: number;
  cotistas: Cotista[];
  /** cada jogo = 15 dezenas */
  jogos: number[][];
  createdAt: number;
}

const cotasValidas = (c: Cotista): number => (Number.isFinite(c.cotas) && c.cotas > 0 ? c.cotas : 0);

/** Total de cotas do bolão. */
export const totalCotas = (b: Bolao): number => b.cotistas.reduce((s, c) => s + cotasValidas(c), 0);

/** Custo total do bolão (nº de jogos × preço por jogo). */
export const custoTotal = (b: Bolao): number => b.jogos.length * Math.max(0, b.precoPorJogo || 0);

/** Custo de uma cota. 0 se não houver cotas. */
export const custoPorCota = (b: Bolao): number => {
  const t = totalCotas(b);
  return t > 0 ? custoTotal(b) / t : 0;
};

/** Quanto um cotista paga (custo por cota × suas cotas). */
export const custoDoCotista = (b: Bolao, c: Cotista): number => custoPorCota(b) * cotasValidas(c);

export interface Rateio {
  cotistaId: string;
  nome: string;
  cotas: number;
  valor: number;
}

/**
 * Rateia um valor total entre os cotistas na proporção das cotas, usando o
 * método do MAIOR RESTO em centavos (a soma dos rateios é exatamente o total,
 * sem perder centavos por arredondamento).
 */
export const ratearValor = (total: number, cotistas: Cotista[]): Rateio[] => {
  const totalCotasN = cotistas.reduce((s, c) => s + cotasValidas(c), 0);
  const base = cotistas.map((c) => ({ cotistaId: c.id, nome: c.nome, cotas: cotasValidas(c), valor: 0 }));
  if (totalCotasN <= 0 || total <= 0) return base;

  const totalCents = Math.round(total * 100);
  const exatos = base.map((r) => (totalCents * r.cotas) / totalCotasN);
  const floors = exatos.map((v) => Math.floor(v));
  let resto = totalCents - floors.reduce((s, v) => s + v, 0);

  // distribui os centavos restantes para os maiores restos fracionários
  const ordem = exatos
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const cents = [...floors];
  for (let k = 0; k < ordem.length && resto > 0; k++) {
    cents[ordem[k].i] += 1;
    resto -= 1;
  }
  return base.map((r, i) => ({ ...r, valor: cents[i] / 100 }));
};

export interface JogoConferido {
  jogo: number[];
  hits: number;
  /** valor do prêmio da faixa (BRL) ou null se não premiado/indisponível */
  valor: number | null;
}

export interface BolaoConferencia {
  porJogo: JogoConferido[];
  /** soma dos prêmios de todos os jogos (faixas conhecidas) */
  totalPremio: number;
  /** nº de jogos premiados (>= 11 acertos) */
  premiados: number;
  /** melhor acerto do bolão */
  melhorAcerto: number;
  /** rateio do prêmio total por cotista */
  rateio: Rateio[];
}

/** Confere todos os jogos do bolão contra um sorteio e rateia o prêmio total. */
export const conferirBolao = (
  bolao: Bolao,
  draw: Array<string | number>,
  premiacoes: Premiacao[] | undefined | null
): BolaoConferencia => {
  let totalPremio = 0;
  let premiados = 0;
  let melhorAcerto = 0;

  const porJogo: JogoConferido[] = bolao.jogos.map((jogo) => {
    const { hits, awarded } = checkGame(jogo, draw);
    if (awarded) premiados += 1;
    if (hits > melhorAcerto) melhorAcerto = hits;
    const prize = prizeForHits(premiacoes, hits);
    const valor = prize?.valor ?? null;
    if (valor != null) totalPremio += valor;
    return { jogo, hits, valor };
  });

  return {
    porJogo,
    totalPremio,
    premiados,
    melhorAcerto,
    rateio: ratearValor(totalPremio, bolao.cotistas),
  };
};
