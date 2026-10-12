import { LotteryResultSchema } from '@/lib/security/schemas';
import type { LotteryResult } from '@/types/lottery';

export const normalizeResult = (raw: unknown): LotteryResult => {
  const data = (raw ?? {}) as Record<string, unknown>;
  // Se os dados vierem da Heroku API
  if (data.dezenas) {
    return LotteryResultSchema.parse({
      ...data,
      valorEstimadoProximoConcurso: data.valorEstimadoProximoConcurso || data.valor_estimado || 0,
      proximoConcurso: data.proximoConcurso || data.proximo_concurso || 0,
    }) as unknown as LotteryResult;
  }

  // Se os dados vierem diretamente da API da Caixa (Portal Loterias)
  if (data.listaDezenas) {
    return LotteryResultSchema.parse({
      concurso: data.numero,
      data: data.dataApuracao,
      dezenas: data.listaDezenas,
      acumulou: data.acumulado,
      proximoConcurso: data.numeroConcursoProximo,
      valorEstimadoProximoConcurso: data.valorEstimadoProximoConcurso || 0,
      dataProximoConcurso: data.dataPróximoSorteio
    }) as unknown as LotteryResult;
  }

  return LotteryResultSchema.parse(data) as unknown as LotteryResult;
};

/** Extrai as dezenas cruas de um resultado, aceitando os formatos das APIs. */
export const extractDezenas = (r: unknown): Array<string | number> => {
  const row = (r ?? {}) as { dezenas?: unknown; listaDezenas?: unknown };
  if (Array.isArray(row.dezenas)) return row.dezenas as Array<string | number>;
  if (Array.isArray(row.listaDezenas)) return row.listaDezenas as Array<string | number>;
  return [];
};

