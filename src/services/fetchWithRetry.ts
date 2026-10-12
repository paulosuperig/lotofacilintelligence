/**
 * fetch com timeout e retry/backoff exponencial. A API primária é instável
 * (herokuapp), então tolerar falhas transitórias melhora muito a robustez.
 */
export const fetchWithRetry = async (
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

