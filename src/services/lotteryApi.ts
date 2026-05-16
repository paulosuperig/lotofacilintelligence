import { LotteryResultSchema, type ValidatedLotteryResult } from "../lib/security/schemas";
import { LotteryResult } from "../types/lottery";

const API_BASE = "https://loteriascaixa-api.herokuapp.com/api";

export const getLatestResult = async (): Promise<LotteryResult> => {
  try {
    const response = await fetch(`${API_BASE}/lotofacil/latest`);
    if (!response.ok) throw new Error("API Offline");
    const data = await response.json();
    
    // Normalização dos campos para garantir consistência entre APIs
    const normalizedData = {
      ...data,
      valorEstimadoProximoConcurso: data.valorEstimadoProximoConcurso || data.valor_estimado || 0,
      proximoConcurso: data.proximoConcurso || data.proximo_concurso || 0,
    };

    return LotteryResultSchema.parse(normalizedData) as unknown as LotteryResult;
  } catch (error) {
    console.error("[Security] Primary API validation failed or offline, trying fallback...", error);
    const fallbackResponse = await fetch(`https://api.guidi.com.br/loteria/lotofacil/ultimo`);
    if (!fallbackResponse.ok) throw new Error("All APIs failed");
    const data = await fallbackResponse.json();
    
    const normalizedData = {
      ...data,
      valorEstimadoProximoConcurso: data.valorEstimadoProximoConcurso || data.valor_estimado || 0,
      proximoConcurso: data.proximoConcurso || data.proximo_concurso || 0,
    };

    return LotteryResultSchema.parse(normalizedData) as unknown as LotteryResult;
  }
};

export const getAllResults = async (): Promise<LotteryResult[]> => {
  const response = await fetch(`${API_BASE}/lotofacil`);
  if (!response.ok) throw new Error("Failed to fetch all results");
  return response.json();
};
