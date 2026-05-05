import { LotteryResult } from "../types/lottery";

const API_URL = "https://loteriascaixa-api.herokuapp.com/api/lotofacil";

export const getLatestResult = async (): Promise<LotteryResult> => {
  const response = await fetch(`${API_URL}/latest`);
  if (!response.ok) throw new Error("Failed to fetch latest result");
  return response.json();
};

export const getAllResults = async (): Promise<LotteryResult[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Failed to fetch all results");
  return response.json();
};
