/**
 * Cache genérico em localStorage com timestamp — usado como camada de
 * resiliência: quando uma API externa instável falha, servimos o último dado
 * conhecido em vez de quebrar a experiência.
 *
 * Puro e testável (lê/escreve via `localStorage`, disponível no jsdom dos testes).
 */
export interface CacheEntry<T> {
  at: number;
  data: T;
}

export interface CacheRead<T> {
  data: T;
  /** true se o dado passou do `maxAgeMs` informado (ainda utilizável como fallback). */
  stale: boolean;
}

/**
 * Lê uma entrada do cache. Retorna `null` quando ausente, corrompida ou sem
 * `localStorage`. Quando `maxAgeMs` é informado, marca `stale` se expirou.
 */
export const readCache = <T>(key: string, maxAgeMs?: number): CacheRead<T> | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheEntry<T>>;
    if (!parsed || typeof parsed.at !== 'number' || !('data' in parsed)) return null;
    const stale = maxAgeMs != null && Date.now() - parsed.at >= maxAgeMs;
    return { data: parsed.data as T, stale };
  } catch {
    return null;
  }
};

/** Grava uma entrada no cache (não-fatal em erro de quota/serialização). */
export const writeCache = <T>(key: string, data: T): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), data } satisfies CacheEntry<T>));
  } catch {
    /* quota/serialização — não-fatal */
  }
};
