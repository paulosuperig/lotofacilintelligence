import { LotteryResultSchema } from "@/lib/security/schemas";
import { LotteryResult } from "@/types/lottery";
import { analyzeHistory, type HistoryAnalysis } from "@/lib/lottery/analysis";

const API_BASE = "https://loteriascaixa-api.herokuapp.com/api";
const FALLBACK_API_BASE = "https://servicebus2.caixa.gov.br/portalloterias/api/lotofacil";

/** Nº de concursos considerados na análise de tendências (janela recente). */
const ANALYSIS_WINDOW = 100;
/** TTL do cache da análise de histórico (30 min). */
const ANALYSIS_TTL_MS = 30 * 60 * 1000;

const normalizeResult = (data: any): LotteryResult => {
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
const extractDezenas = (r: unknown): Array<string | number> => {
  const row = (r ?? {}) as { dezenas?: unknown; listaDezenas?: unknown };
  if (Array.isArray(row.dezenas)) return row.dezenas as Array<string | number>;
  if (Array.isArray(row.listaDezenas)) return row.listaDezenas as Array<string | number>;
  return [];
};

let analysisCache: { at: number; data: HistoryAnalysis } | null = null;

export const lotteryService = {
  async getLatestResult(): Promise<LotteryResult> {
    try {
      const response = await fetch(`${API_BASE}/lotofacil/latest`);
      if (!response.ok) throw new Error("API Primary Offline");
      const data = await response.json();
      return normalizeResult(data);
    } catch (error) {
      console.error("[LotteryService] Primary API failed, trying official Caixa API...", error);
      try {
        // Nota: A API da Caixa pode exigir headers ou ter CORS restrito em alguns ambientes
        const response = await fetch(FALLBACK_API_BASE);
        if (!response.ok) throw new Error("Caixa API Offline");
        const data = await response.json();
        return normalizeResult(data);
      } catch (fallbackError) {
        console.error("[LotteryService] All APIs failed", fallbackError);
        throw fallbackError;
      }
    }
  },

  /** Retorna a lista bruta de todos os concursos (mais recente primeiro). */
  async getAllResults(): Promise<unknown[]> {
    const response = await fetch(`${API_BASE}/lotofacil`);
    if (!response.ok) throw new Error("Failed to fetch all results");
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  /**
   * Análise estatística do histórico recente (frequência, atraso, quentes/frias
   * e atrasadas). Cacheada em memória por `ANALYSIS_TTL_MS`.
   */
  async getHistoryAnalysis(force = false): Promise<HistoryAnalysis | null> {
    if (!force && analysisCache && Date.now() - analysisCache.at < ANALYSIS_TTL_MS) {
      return analysisCache.data;
    }
    try {
      const all = await this.getAllResults();
      if (all.length === 0) return analysisCache?.data ?? null;
      const draws = all.map(extractDezenas);
      const data = analyzeHistory(draws, {
        newestFirst: true,
        window: ANALYSIS_WINDOW,
        topN: 8,
      });
      analysisCache = { at: Date.now(), data };
      return data;
    } catch (error) {
      console.error("[LotteryService] Falha ao analisar histórico:", error);
      return analysisCache?.data ?? null;
    }
  },
};
