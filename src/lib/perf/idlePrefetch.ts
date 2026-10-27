type Loader = () => Promise<unknown>;

interface NetworkInfo { saveData?: boolean; effectiveType?: string }

/** Whether the connection allows background prefetching (respects Save-Data and 2G). */
export function canPrefetch(nav: { connection?: NetworkInfo } | undefined = typeof navigator !== 'undefined' ? (navigator as { connection?: NetworkInfo }) : undefined): boolean {
  const c = nav?.connection;
  if (!c) return true;
  if (c.saveData) return false;
  return !/(^|-)2g$/.test(c.effectiveType ?? '');
}

/**
 * Loads code chunks one by one while the browser is idle so tab switches feel instant.
 * Only downloads code — never starts data queries. Returns a cancel function.
 */
export function prefetchWhenIdle(loaders: Loader[], delayMs = 1500): () => void {
  if (typeof window === 'undefined' || !canPrefetch()) return () => {};
  let cancelled = false;
  let idleId: number | undefined;
  const ric = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline), 200));
  const cic = window.cancelIdleCallback ?? window.clearTimeout;
  const queue = [...loaders];
  const next = () => {
    if (cancelled || queue.length === 0) return;
    idleId = ric(() => {
      const load = queue.shift();
      if (!load || cancelled) return;
      load().catch(() => undefined).finally(next);
    }, { timeout: 4000 });
  };
  const timer = window.setTimeout(next, delayMs);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
    if (idleId !== undefined) cic(idleId);
  };
}
