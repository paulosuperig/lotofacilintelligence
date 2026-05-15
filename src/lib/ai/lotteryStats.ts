// Utility helpers to derive Lotofácil statistical context for the AI assistant.
import type { LotteryResult } from '@/types/lottery';

const PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23]);
// Moldura (frame) numbers in a 5x5 Lotofácil grid (1..25):
// 1,2,3,4,5,6,10,11,15,16,20,21,22,23,24,25
const MOLDURA = new Set([1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25]);

export interface LotteryContextStats {
  concurso?: number;
  data?: string;
  dezenas: number[];
  soma: number;
  pares: number;
  impares: number;
  primos: number;
  moldura: number;
  miolo: number;
  ausentes: number[];
}

const toNums = (arr: string[] | number[] | undefined): number[] => {
  if (!arr) return [];
  return Array.from(
    new Set(
      (arr as Array<string | number>)
        .map((n) => (typeof n === 'number' ? n : parseInt(String(n), 10)))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 25)
    )
  ).sort((a, b) => a - b);
};

export const computeLotteryStats = (result: LotteryResult | null): LotteryContextStats | null => {
  if (!result) return null;
  const dezenas = toNums(result.dezenas);
  if (dezenas.length === 0) return null;

  const pares = dezenas.filter((n) => n % 2 === 0).length;
  const primos = dezenas.filter((n) => PRIMES.has(n)).length;
  const moldura = dezenas.filter((n) => MOLDURA.has(n)).length;
  const ausentes: number[] = [];
  for (let n = 1; n <= 25; n++) if (!dezenas.includes(n)) ausentes.push(n);

  return {
    concurso: result.concurso,
    data: result.data,
    dezenas,
    soma: dezenas.reduce((a, b) => a + b, 0),
    pares,
    impares: dezenas.length - pares,
    primos,
    moldura,
    miolo: dezenas.length - moldura,
    ausentes,
  };
};

export const formatStatsForPrompt = (stats: LotteryContextStats | null): string => {
  if (!stats) {
    return 'CONTEXTO_OFICIAL: indisponível no momento. Baseie sugestões em princípios estatísticos clássicos da Lotofácil (15 dezenas de 1-25, equilíbrio par/ímpar 7-8 ou 8-7, soma ideal 180-220, 4-5 primos, distribuição equilibrada moldura/miolo).';
  }
  return [
    'CONTEXTO_OFICIAL_ULTIMO_CONCURSO (use como base factual — não invente outros números):',
    `- Concurso: ${stats.concurso ?? '—'} (${stats.data ?? '—'})`,
    `- Dezenas sorteadas: ${stats.dezenas.map((n) => String(n).padStart(2, '0')).join(', ')}`,
    `- Soma: ${stats.soma} | Pares: ${stats.pares} | Ímpares: ${stats.impares} | Primos: ${stats.primos} | Moldura: ${stats.moldura} | Miolo: ${stats.miolo}`,
    `- Dezenas ausentes (candidatas a "atraso"): ${stats.ausentes.map((n) => String(n).padStart(2, '0')).join(', ')}`,
    '',
    'PARÂMETROS ESTATÍSTICOS DE REFERÊNCIA (Lotofácil):',
    '- Soma típica: 180–220.',
    '- Equilíbrio par/ímpar mais comum: 7-8 ou 8-7.',
    '- Primos: 4–5 dezenas.',
    '- Repetidas em relação ao concurso anterior: tipicamente 8–10.',
    '- Moldura: 9–11 dezenas; miolo: 4–6 dezenas.',
  ].join('\n');
};
