import { LotteryResultSchema } from "@/lib/security/schemas";
import { LotteryResult } from "@/types/lottery";

const API_BASE = "https://loteriascaixa-api.herokuapp.com/api";
const FALLBACK_API_BASE = "https://servicebus2.caixa.gov.br/portalloterias/api/lotofacil";
const REQUEST_TIMEOUT_MS = 10_000;

/** fetch com timeout via AbortController — evita a UI travar se a API pendurar. */
const fetchWithTimeout = async (url: string, timeout = REQUEST_TIMEOUT_MS): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const normalizeResult = (data: Record<string, unknown>): LotteryResult => {
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

export const lotteryService = {
  async getLatestResult(): Promise<LotteryResult> {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/lotofacil/latest`);
      if (!response.ok) throw new Error("API Primary Offline");
      const data = await response.json();
      return normalizeResult(data);
    } catch (error) {
      console.error("[LotteryService] Primary API failed, trying official Caixa API...", error);
      try {
        // Nota: A API da Caixa pode exigir headers ou ter CORS restrito em alguns ambientes
        const response = await fetchWithTimeout(FALLBACK_API_BASE);
        if (!response.ok) throw new Error("Caixa API Offline");
        const data = await response.json();
        return normalizeResult(data);
      } catch (fallbackError) {
        console.error("[LotteryService] All APIs failed", fallbackError);
        throw fallbackError;
      }
    }
  },

  async getAllResults(): Promise<LotteryResult[]> {
    const response = await fetchWithTimeout(`${API_BASE}/lotofacil`);
    if (!response.ok) throw new Error("Failed to fetch all results");
    return response.json();
  }
};
