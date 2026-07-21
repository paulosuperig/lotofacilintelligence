// Utility helpers to derive Lotofácil statistical context for the AI assistant.
import type { LotteryResult } from '@/types/lottery';
import { PRIME_SET as PRIMES, MOLDURA_SET as MOLDURA, BANDS } from '@/lib/lottery/constants';
import type { HistoryAnalysis } from '@/lib/lottery/analysis';

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

/**
 * Regras estatísticas de composição derivadas da FONTE ÚNICA (`BANDS`), para
 * injeção no system prompt. Evita que os números do prompt divirjam do
 * validador/gerador — antes o prompt fixava "soma 180-220" enquanto o resto do
 * app usa 180-210.
 */
export const formatCriteriaForPrompt = (): string =>
  [
    `- Soma entre ${BANDS.soma.idealMin} e ${BANDS.soma.idealMax} (faixa de ~70% dos concursos históricos).`,
    `- Distribuição par/ímpar equilibrada: ${BANDS.pares.idealMin}-${BANDS.pares.idealMax} pares (logo ${15 - BANDS.pares.idealMax}-${15 - BANDS.pares.idealMin} ímpares).`,
    `- Primos: ${BANDS.primos.idealMin} a ${BANDS.primos.idealMax} (de {2,3,5,7,11,13,17,19,23}).`,
    `- Moldura (16 nº externos): ${BANDS.moldura.idealMin} a ${BANDS.moldura.idealMax}; Miolo (9 nº centrais): ${BANDS.miolo.idealMin} a ${BANDS.miolo.idealMax}.`,
    `- Repetidas do último concurso: ${BANDS.repetidas.idealMin} a ${BANDS.repetidas.idealMax}.`,
    `- Máximo ${BANDS.sequencia.idealMax} dezenas em sequência consecutiva.`,
    '- Inclua ao menos 2 dezenas "em atraso" (dos ausentes do último concurso).',
  ].join('\n');

export const formatStatsForPrompt = (stats: LotteryContextStats | null): string => {
  if (!stats) {
    return `CONTEXTO_OFICIAL: indisponível no momento. Baseie sugestões nos parâmetros estatísticos clássicos da Lotofácil (15 dezenas de 1-25, pares ${BANDS.pares.idealMin}-${BANDS.pares.idealMax}, soma ${BANDS.soma.idealMin}-${BANDS.soma.idealMax}, ${BANDS.primos.idealMin}-${BANDS.primos.idealMax} primos, distribuição equilibrada moldura/miolo).`;
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

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Formata a análise REAL do histórico (frequência, atraso, co-ocorrência) para
 * o prompt da IA. Sem isto, o modelo apenas "chuta" quais dezenas são quentes ou
 * atrasadas. Com dados reais, os jogos ficam factualmente ancorados e assertivos.
 */
export const formatAnalysisForPrompt = (analysis: HistoryAnalysis | null): string => {
  if (!analysis || analysis.totalConcursos === 0) {
    return 'DADOS_HISTORICOS: indisponíveis (modo offline). Trabalhe apenas com o último concurso e os parâmetros de referência.';
  }
  const quentes = analysis.quentes
    .map((n) => `${pad(n)} (${Math.round((analysis.porNumero[n]?.percentual ?? 0) * 100)}%)`)
    .join(', ');
  const frias = analysis.frias.map((n) => pad(n)).join(', ');
  const atrasadas = analysis.atrasadas
    .map((n) => `${pad(n)} (${analysis.porNumero[n]?.atraso ?? 0}c)`)
    .join(', ');
  const pares = analysis.topPairs
    .slice(0, 8)
    .map((p) => `${pad(p.a)}-${pad(p.b)} (${p.count}x)`)
    .join(', ');

  return [
    `DADOS_HISTORICOS_REAIS (base factual — ${analysis.totalConcursos} concursos analisados):`,
    `- Dezenas QUENTES (mais frequentes, % de presença): ${quentes}`,
    `- Dezenas FRIAS (menos frequentes): ${frias}`,
    `- Dezenas ATRASADAS (concursos sem sair): ${atrasadas}`,
    `- PARES que mais saem juntos: ${pares}`,
    'Use ESTES números — não invente frequências. Combine quentes (recorrência),',
    'atrasadas (pressão estatística) e pares fortes na composição dos jogos.',
  ].join('\n');
};
