import { LotteryResultSchema } from "../../lib/security/schemas";
import { LotteryResult } from "../../types/lottery";

const API_BASE = "https://loteriascaixa-api.herokuapp.com/api";
const FALLBACK_API_BASE = "https://api.guidi.com.br/loteria/lotofacil/ultimo";

const normalizeResult = (data: any): LotteryResult => {
  const normalizedData = {
    ...data,
    valorEstimadoProximoConcurso: data.valorEstimadoProximoConcurso || data.valor_estimado || 0,
    proximoConcurso: data.proximoConcurso || data.proximo_concurso || 0,
  };

  return LotteryResultSchema.parse(normalizedData) as unknown as LotteryResult;
};

export const lotteryService = {
  async getLatestResult(): Promise<LotteryResult> {
    try {
      const response = await fetch(`${API_BASE}/lotofacil/latest`);
      if (!response.ok) throw new Error("API Offline");
      const data = await response.json();
      return normalizeResult(data);
    } catch (error) {
      console.error("[LotteryService] Primary API failed, trying fallback...", error);
      const fallbackResponse = await fetch(FALLBACK_API_BASE);
      if (!fallbackResponse.ok) throw new Error("All APIs failed");
      const data = await fallbackResponse.json();
      return normalizeResult(data);
    }
  },

  async getAllResults(): Promise<LotteryResult[]> {
    const response = await fetch(`${API_BASE}/lotofacil`);
    if (!response.ok) throw new Error("Failed to fetch all results");
    return response.json();
  }
};
