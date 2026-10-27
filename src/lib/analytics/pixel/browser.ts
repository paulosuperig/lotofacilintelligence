/** Utilitários de navegador do Meta Pixel: tipos globais, hash, cookies e IDs de evento. */
type FbqFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
    __META_PIXEL_INITIALIZED__?: boolean;
    __META_PIXEL_ID__?: string | null;
  }
}

export const SCRIPT_ID = 'meta-pixel-script';
export const DEFAULT_CURRENCY = 'BRL';

export const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

/** SHA-256 (hex, lowercase) — exigido pelo Meta para Advanced Matching. */
export const sha256 = async (input: string): Promise<string> => {
  if (!isBrowser() || !window.crypto?.subtle) return '';
  const data = new TextEncoder().encode(input.trim().toLowerCase());
  const buf = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/** UUID v4 — usado como eventID para deduplicação Pixel ↔ CAPI. */
export const generateEventId = (): string => {
  if (isBrowser() && typeof window.crypto?.randomUUID === 'function') return window.crypto.randomUUID();
  return 'evt-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
};

const getCookie = (name: string): string | undefined => {
  if (!isBrowser()) return undefined;
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : undefined;
};

/** Dados de contexto úteis para CAPI server-side downstream. */
export const getPixelContext = () => ({
  event_source_url: isBrowser() ? window.location.href : undefined,
  fbp: getCookie('_fbp'),
  fbc: getCookie('_fbc'),
});
