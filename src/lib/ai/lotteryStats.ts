// Utility helpers to derive Lotofácil statistical context for the AI assistant.
import type { LotteryResult } from '@/types/lottery';
import { PRIME_SET as PRIMES, MOLDURA_SET as MOLDURA, BANDS } from '@/lib/lottery/constants';

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
    `- Soma típica: ${BANDS.soma.idealMin}–${BANDS.soma.idealMax}.`,
    `- Pares: ${BANDS.pares.idealMin}–${BANDS.pares.idealMax}; ímpares: ${BANDS.impares.idealMin}–${BANDS.impares.idealMax}.`,
    `- Primos: ${BANDS.primos.idealMin}–${BANDS.primos.idealMax} dezenas.`,
    `- Repetidas em relação ao concurso anterior: tipicamente ${BANDS.repetidas.idealMin}–${BANDS.repetidas.idealMax}.`,
    `- Moldura: ${BANDS.moldura.idealMin}–${BANDS.moldura.idealMax} dezenas; miolo: ${BANDS.miolo.idealMin}–${BANDS.miolo.idealMax} dezenas.`,
  ].join('\n');
};
