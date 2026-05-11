import { LotteryResultSchema, type ValidatedLotteryResult } from "../lib/security/schemas";
import { LotteryResult } from "../types/lottery";

const API_BASE = "https://loteriascaixa-api.herokuapp.com/api";

export const getLatestResult = async (): Promise<LotteryResult> => {
  try {
    const response = await fetch(`${API_BASE}/lotofacil/latest`);
    if (!response.ok) throw new Error("API Offline");
    const data = await response.json();
    return LotteryResultSchema.parse(data) as unknown as LotteryResult;
  } catch (error) {
    console.error("[Security] Primary API validation failed or offline, trying fallback...", error);
    const fallbackResponse = await fetch(`https://api.guidi.com.br/loteria/lotofacil/ultimo`);
    if (!fallbackResponse.ok) throw new Error("All APIs failed");
    const data = await fallbackResponse.json();
    return LotteryResultSchema.parse(data) as unknown as LotteryResult;
  }
};

export const getAllResults = async (): Promise<LotteryResult[]> => {
  const response = await fetch(`${API_BASE}/lotofacil`);
  if (!response.ok) throw new Error("Failed to fetch all results");
  return response.json();
};
