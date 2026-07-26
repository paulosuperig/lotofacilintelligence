import { LotteryResultSchema } from "@/lib/security/schemas";
import { LotteryResult } from "@/types/lottery";
import { analyzeHistory, normalizeDraw, type HistoryAnalysis } from "@/lib/lottery/analysis";
import { readCache, writeCache } from "@/lib/cache/localCache";

const API_BASE = "https://loteriascaixa-api.herokuapp.com/api";
const FALLBACK_API_BASE = "https://servicebus2.caixa.gov.br/portalloterias/api/lotofacil";

/** Cache do último resultado (resiliência a quedas da API). TTL de 30 min. */
const LATEST_CACHE_KEY = "lf_latest_v1";
const LATEST_TTL_MS = 30 * 60 * 1000;
/** Prefixo do cache por concurso — concursos passados são IMUTÁVEIS. */
const CONCURSO_CACHE_PREFIX = "lf_concurso_";

/** Nº de concursos considerados na análise de tendências (janela recente). */
const ANALYSIS_WINDOW = 100;
/** TTL do cache da análise de histórico (30 min). */
const ANALYSIS_TTL_MS = 30 * 60 * 1000;
/** Chave de persistência da análise em localStorage. */
const ANALYSIS_STORAGE_KEY = "lf_history_analysis_v2";

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

const normalizeResult = (raw: unknown): LotteryResult => {
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
      const result = normalizeResult(data);
      writeCache(LATEST_CACHE_KEY, result); // aquece o cache p/ resiliência
      return result;
    } catch (error) {
      console.error("[LotteryService] Primary API failed, trying official Caixa API...", error);
      try {
        // Nota: A API da Caixa pode exigir headers ou ter CORS restrito em alguns ambientes
        const response = await fetchWithRetry(FALLBACK_API_BASE, { retries: 1 });
        const data = await response.json();
        const result = normalizeResult(data);
        writeCache(LATEST_CACHE_KEY, result);
        return result;
      } catch (fallbackError) {
        // Resiliência: se AMBAS as APIs caírem, serve o último resultado conhecido
        // (cache local) em vez de quebrar a tela. Só falha se nunca houve sucesso.
        const cached = readCache<LotteryResult>(LATEST_CACHE_KEY);
        if (cached) {
          console.warn("[LotteryService] APIs indisponíveis — servindo último resultado em cache.");
          return cached.data;
        }
        console.error("[LotteryService] All APIs failed and no cache available", fallbackError);
        throw fallbackError;
      }
    }
  },

  /**
   * Resultado de um concurso específico (inclui `premiacoes` com os valores).
   * Usado pelo Conferidor para checar jogos contra qualquer concurso.
   */
  async getResultByConcurso(concurso: number): Promise<LotteryResult> {
    const n = Math.floor(concurso);
    if (!Number.isInteger(n) || n < 1) throw new Error("Concurso inválido.");
    const cacheKey = `${CONCURSO_CACHE_PREFIX}${n}`;
    // Concurso passado é imutável: se já temos, servimos direto do cache.
    const cached = readCache<LotteryResult>(cacheKey);
    if (cached) return cached.data;
    const response = await fetchWithRetry(`${API_BASE}/lotofacil/${n}`, { retries: 1 });
    const data = await response.json();
    const result = normalizeResult(data);
    writeCache(cacheKey, result);
    return result;
  },

  /** Retorna a lista bruta de todos os concursos (mais recente primeiro). */
  async getAllResults(): Promise<unknown[]> {
    const response = await fetchWithRetry(`${API_BASE}/lotofacil`, { timeoutMs: 15000 });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  /**
   * Concursos em ordem CRONOLÓGICA (mais antigo → mais recente), só os válidos
   * (15 dezenas). É o formato que o backtest walk-forward (`runBacktest`) espera.
   */
  async getChronologicalDraws(): Promise<number[][]> {
    const all = await this.getAllResults(); // mais recente primeiro
    const draws = all
      .map(extractDezenas)
      .map(normalizeDraw)
      .filter((d) => d.length === 15);
    return draws.reverse(); // antigo → recente
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
