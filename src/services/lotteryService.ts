import { LotteryResultSchema } from "@/lib/security/schemas";
import { LotteryResult } from "@/types/lottery";
import { analyzeHistory, type HistoryAnalysis } from "@/lib/lottery/analysis";

const API_BASE = "https://loteriascaixa-api.herokuapp.com/api";
const FALLBACK_API_BASE = "https://servicebus2.caixa.gov.br/portalloterias/api/lotofacil";

/** Nº de concursos considerados na análise de tendências (janela recente). */
const ANALYSIS_WINDOW = 100;
/** TTL do cache da análise de histórico (30 min). */
const ANALYSIS_TTL_MS = 30 * 60 * 1000;
/** Chave de persistência da análise em localStorage. */
const ANALYSIS_STORAGE_KEY = "lf_history_analysis_v1";

/**
 * fetch com timeout e retry/backoff exponencial. A API primária é instável
 * (herokuapp), então tolerar falhas transitórias melhora muito a robustez.
 */
const fetchWithRetry = async (
  url: string,
  { retries = 2, timeoutMs = 8000 }: { retries?: number; timeoutMs?: number } = {}
): Promise<Response> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("fetch failed");
};

const readStoredAnalysis = (): { at: number; data: HistoryAnalysis } | null => {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(ANALYSIS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.at === "number" && parsed.data) return parsed;
  } catch { /* ignore corrupted cache */ }
  return null;
};

const writeStoredAnalysis = (entry: { at: number; data: HistoryAnalysis }): void => {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(entry));
  } catch { /* quota/serialization errors são não-fatais */ }
};

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
      const response = await fetchWithRetry(`${API_BASE}/lotofacil/latest`);
      const data = await response.json();
      return normalizeResult(data);
    } catch (error) {
      console.error("[LotteryService] Primary API failed, trying official Caixa API...", error);
      try {
        // Nota: A API da Caixa pode exigir headers ou ter CORS restrito em alguns ambientes
        const response = await fetchWithRetry(FALLBACK_API_BASE, { retries: 1 });
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
    const response = await fetchWithRetry(`${API_BASE}/lotofacil`, { timeoutMs: 15000 });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  /**
   * Análise estatística do histórico recente (frequência, atraso, quentes/frias
   * e atrasadas). Cache em memória + localStorage (`ANALYSIS_TTL_MS`), com
   * degradação graciosa: em falha de rede, devolve o último dado conhecido.
   */
  async getHistoryAnalysis(force = false): Promise<HistoryAnalysis | null> {
    // Hidrata do localStorage na primeira chamada (carga instantânea/offline).
    if (!analysisCache) analysisCache = readStoredAnalysis();

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
      const entry = { at: Date.now(), data };
      analysisCache = entry;
      writeStoredAnalysis(entry);
      return data;
    } catch (error) {
      console.error("[LotteryService] Falha ao analisar histórico:", error);
      return analysisCache?.data ?? null; // usa cache antigo (mesmo expirado)
    }
  },
};
