import { normalizeResult, extractDezenas } from './lotteryResultMapper';
import { fetchWithRetry } from './fetchWithRetry';
import { LotteryResult } from "@/types/lottery";
import { analyzeHistory, normalizeDraw, type HistoryAnalysis } from "@/lib/lottery/analysis";
import { readCache, writeCache } from "@/lib/cache/localCache";
import { createRequestCache } from '@/lib/cache/requestCache';

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


let analysisCache: { at: number; data: HistoryAnalysis } | null = null;

// One shared response for trends, generator, AI and backtest during this session.
const loadAllResults = createRequestCache<unknown[]>(ANALYSIS_TTL_MS, async () => {
  const response = await fetchWithRetry(`${API_BASE}/lotofacil`, { timeoutMs: 15000 });
  const data: unknown = await response.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('Histórico indisponível.');
  return data;
});

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
    return loadAllResults();
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
