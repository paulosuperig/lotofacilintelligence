import { LotteryResultSchema } from "../lib/security/schemas";
import { LotteryResult } from "../types/lottery";

const API_BASE = "https://loteriascaixa-api.herokuapp.com/api";

export const getLatestResult = async (): Promise<LotteryResult> => {
  try {
    const response = await fetch(`${API_BASE}/lotofacil/latest`);
    if (!response.ok) throw new Error("API Offline");
    const data = await response.json();
    
    const normalizedData = {
      ...data,
      valorEstimadoProximoConcurso: data.valorEstimadoProximoConcurso || data.valor_estimado || 0,
      proximoConcurso: data.proximoConcurso || data.proximo_concurso || 0,
    };

    return LotteryResultSchema.parse(normalizedData) as unknown as LotteryResult;
  } catch (error) {
    console.error("[Security] Primary API validation failed or offline, trying fallback...", error);
    try {
      const fallbackResponse = await fetch(`https://api.guidi.com.br/loteria/lotofacil/ultimo`);
      if (!fallbackResponse.ok) throw new Error("All APIs failed");
      const data = await fallbackResponse.json();
      
      const normalizedData = {
        ...data,
        valorEstimadoProximoConcurso: data.valorEstimadoProximoConcurso || data.valor_estimado || 0,
        proximoConcurso: data.proximoConcurso || data.proximo_concurso || 0,
      };

      return LotteryResultSchema.parse(normalizedData) as unknown as LotteryResult;
    } catch (fallbackError) {
      console.error("Fallback API also failed", fallbackError);
      throw fallbackError;
    }
  }
};

export const getRecentResults = async (limit: number = 10): Promise<LotteryResult[]> => {
  try {
    const response = await fetch(`${API_BASE}/lotofacil`);
    if (!response.ok) throw new Error("Failed to fetch recent results");
    const data = await response.json();
    
    // Sort by concurso descending and limit
    const sorted = Array.isArray(data) 
      ? data.sort((a: any, b: any) => (b.concurso || 0) - (a.concurso || 0)).slice(0, limit)
      : [];
      
    return sorted.map((res: any) => ({
      ...res,
      valorEstimadoProximoConcurso: res.valorEstimadoProximoConcurso || res.valor_estimado || 0,
      proximoConcurso: res.proximoConcurso || res.proximo_concurso || 0,
    })) as LotteryResult[];
  } catch (error) {
    console.error("Error fetching recent results:", error);
    return [];
  }
};

export const calculateFrequencies = (results: LotteryResult[]) => {
  const frequencies: Record<string, number> = {};
  for (let i = 1; i <= 25; i++) {
    frequencies[String(i).padStart(2, '0')] = 0;
  }
  
  results.forEach(res => {
    res.dezenas.forEach(num => {
      const formatted = String(num).padStart(2, '0');
      frequencies[formatted] = (frequencies[formatted] || 0) + 1;
    });
  });
  
  const sorted = Object.entries(frequencies)
    .sort(([, a], [, b]) => b - a);
    
  return {
    hot: sorted.slice(0, 5).map(([num]) => num),
    cold: sorted.slice(-5).reverse().map(([num]) => num)
  };
};
