import { LotteryResult } from "../types/lottery";

const API_BASE = "https://loteriascaixa-api.herokuapp.com/api";

export const getLatestResult = async (): Promise<LotteryResult> => {
  try {
    const response = await fetch(`${API_BASE}/lotofacil/latest`);
    if (!response.ok) throw new Error("API Offline");
    return response.json();
  } catch (error) {
    console.error("API Primary error, trying fallback...", error);
    // Potential fallback URL if primary fails
    const fallbackResponse = await fetch(`https://api.guidi.com.br/loteria/lotofacil/ultimo`);
    if (!fallbackResponse.ok) throw new Error("All APIs failed");
    return fallbackResponse.json();
  }
};

export const getAllResults = async (): Promise<LotteryResult[]> => {
  const response = await fetch(`${API_BASE}/lotofacil`);
  if (!response.ok) throw new Error("Failed to fetch all results");
  return response.json();
};
