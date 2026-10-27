import { isBrowser, generateEventId, DEFAULT_CURRENCY } from './browser';

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
