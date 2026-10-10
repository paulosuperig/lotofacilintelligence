/** Bounded, session-only cache with in-flight deduplication; never persists data. */
export function createRequestCache<T>(ttlMs: number, load: () => Promise<T>) {
  let cached: { expires: number; value: T } | undefined;
  let pending: Promise<T> | undefined;
  return () => {
    if (cached && Date.now() < cached.expires) return Promise.resolve(cached.value);
    if (pending) return pending;
    pending = load().then((value) => {
      cached = { value, expires: Date.now() + ttlMs };
      return value;
    }).finally(() => { pending = undefined; });
    return pending;
  };
}