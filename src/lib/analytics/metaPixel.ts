/**
 * Skill: @skillslovable — Meta Pixel (padrões enterprise)
 *
 * Boas práticas implementadas:
 *  - Advanced Matching automático (em/external_id hasheados em SHA-256 — PII nunca sai em claro)
 *  - Deduplicação pronta para Conversions API (eventID + eventSourceUrl)
 *  - Eventos padrão Meta (PageView, ViewContent, Lead, CompleteRegistration,
 *    Search, Subscribe, Contact) + Custom Events tipados
 *  - value/currency em todos eventos monetizáveis (otimização de campanhas)
 *  - content_name / content_category / content_ids consistentes
 *  - Captura de fbp/fbc (cookies do navegador) para deduplicação CAPI
 *  - SPA-aware: helper para disparar ViewContent em mudança de rota/aba
 *  - Guarda contra init duplicado e validação de Pixel ID
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    __META_PIXEL_INITIALIZED__?: boolean;
    __META_PIXEL_ID__?: string | null;
  }
}

const SCRIPT_ID = 'meta-pixel-script';
const DEFAULT_CURRENCY = 'BRL';

/* ---------------------------- Utils ---------------------------- */

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

/** SHA-256 (hex, lowercase) — exigido pelo Meta para Advanced Matching. */
const sha256 = async (input: string): Promise<string> => {
  if (!isBrowser() || !window.crypto?.subtle) return '';
  const data = new TextEncoder().encode(input.trim().toLowerCase());
  const buf = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/** UUID v4 — usado como eventID para deduplicação Pixel ↔ CAPI. */
export const generateEventId = (): string => {
  if (isBrowser() && window.crypto?.randomUUID) return window.crypto.randomUUID();
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

/* ---------------------------- Init ---------------------------- */

const PIXEL_ID_REGEX = /^\d{6,20}$/;

export const initMetaPixel = (pixelId: string): boolean => {
  if (!isBrowser()) return false;
  const id = (pixelId || '').trim();
  if (!PIXEL_ID_REGEX.test(id)) {
    console.warn('[MetaPixel] Pixel ID inválido, abortando init.');
    return false;
  }
  if (window.__META_PIXEL_INITIALIZED__ && window.__META_PIXEL_ID__ === id) return true;

  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.id = SCRIPT_ID;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  // autoConfig: true habilita microdata enrichment do Meta (recomendado).
  window.fbq?.('set', 'autoConfig', true, id);
  window.fbq?.('init', id);
  window.fbq?.('track', 'PageView');

  window.__META_PIXEL_INITIALIZED__ = true;
  window.__META_PIXEL_ID__ = id;
  return true;
};

/* ----------------------- Advanced Matching ---------------------- */
/**
 * Re-inicializa o Pixel injetando dados hasheados do usuário autenticado.
 * Melhora drasticamente o match rate em campanhas (recomendação oficial Meta).
 */
export const setAdvancedMatching = async (params: {
  email?: string | null;
  externalId?: string | null;
  phone?: string | null;
}): Promise<void> => {
  if (!isBrowser() || !window.fbq || !window.__META_PIXEL_ID__) return;
  try {
    const userData: Record<string, string> = {};
    if (params.email) userData.em = await sha256(params.email);
    if (params.externalId) userData.external_id = await sha256(params.externalId);
    if (params.phone) userData.ph = await sha256(params.phone.replace(/\D/g, ''));
    if (Object.keys(userData).length === 0) return;
    window.fbq('init', window.__META_PIXEL_ID__, userData);
  } catch (e) {
    console.warn('[MetaPixel] setAdvancedMatching falhou:', e);
  }
};

export const clearAdvancedMatching = () => {
  if (!isBrowser() || !window.fbq || !window.__META_PIXEL_ID__) return;
  window.fbq('init', window.__META_PIXEL_ID__);
};

/* ----------------------------- Track ---------------------------- */

export type StandardEvent =
  | 'PageView'
  | 'ViewContent'
  | 'Search'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Subscribe'
  | 'StartTrial'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Contact'
  | 'Schedule'
  | 'SubmitApplication'
  | 'FindLocation'
  | 'CustomizeProduct'
  | 'Donate';

export interface BaseEventParams {
  /** Para deduplicação CAPI server-side. Se omitido, é gerado automaticamente. */
  eventID?: string;
  /** Override do contexto (URL) — útil para SPA. */
  eventSourceUrl?: string;
  /** Nome amigável do conteúdo. */
  content_name?: string;
  /** Categoria/agrupamento (ex.: "ai_chat", "game_generator"). */
  content_category?: string;
  /** IDs relacionados (SKU, slug, etc.). */
  content_ids?: Array<string | number>;
  content_type?: 'product' | 'product_group' | string;
  /** Valor monetário associado (usado pelo Meta para otimização de bid). */
  value?: number;
  currency?: string;
  /** Quantidade de itens (ex.: jogos salvos). */
  num_items?: number;
  /** Termos de busca (Search event). */
  search_string?: string;
  /** Status de conclusão (CompleteRegistration). */
  status?: boolean | string;
  /** Quaisquer parâmetros customizados extras. */
  [key: string]: unknown;
}

const buildParams = (params?: BaseEventParams) => {
  if (!params) return { params: {}, eventID: generateEventId() };
  const { eventID, eventSourceUrl, ...rest } = params;
  const finalParams: Record<string, unknown> = { ...rest };
  if (finalParams.value != null && !finalParams.currency) finalParams.currency = DEFAULT_CURRENCY;
  return {
    params: finalParams,
    eventID: eventID || generateEventId(),
    eventSourceUrl,
  };
};

/** Dispara evento padrão. Retorna eventID para uso em deduplicação CAPI. */
export const trackEvent = (event: StandardEvent, params?: BaseEventParams): string => {
  if (!isBrowser() || !window.fbq) return '';
  const { params: p, eventID, eventSourceUrl } = buildParams(params);
  try {
    window.fbq('track', event, p, { eventID, ...(eventSourceUrl ? { eventSourceUrl } : {}) });
  } catch (e) {
    console.warn('[MetaPixel] track error', e);
  }
  return eventID;
};

/** Dispara evento customizado. Retorna eventID. */
export const trackCustom = (event: string, params?: BaseEventParams): string => {
  if (!isBrowser() || !window.fbq) return '';
  const { params: p, eventID, eventSourceUrl } = buildParams(params);
  try {
    window.fbq('trackCustom', event, p, { eventID, ...(eventSourceUrl ? { eventSourceUrl } : {}) });
  } catch (e) {
    console.warn('[MetaPixel] trackCustom error', e);
  }
  return eventID;
};

/** Dispara PageView/ViewContent em mudança de rota SPA. */
export const trackPageView = (route?: string) => {
  trackEvent('PageView');
  if (route) {
    trackEvent('ViewContent', {
      content_name: route,
      content_category: 'spa_route',
    });
  }
};
