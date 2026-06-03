/**
 * Skill: @skillslovable — Meta/Facebook Ads Pixel
 * Carregamento dinâmico do Pixel a partir do ID configurado pelo admin.
 * Suporta PageView automático + eventos customizados para análise de campanha.
 */

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    __META_PIXEL_INITIALIZED__?: boolean;
    __META_PIXEL_ID__?: string | null;
  }
}

const SCRIPT_ID = 'meta-pixel-script';

export const initMetaPixel = (pixelId: string): boolean => {
  if (typeof window === 'undefined') return false;
  if (!pixelId || !/^\d{6,20}$/.test(pixelId.trim())) {
    console.warn('[MetaPixel] Pixel ID inválido, abortando init.');
    return false;
  }
  if (window.__META_PIXEL_INITIALIZED__ && window.__META_PIXEL_ID__ === pixelId) return true;

  // Loader oficial Meta
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

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
  window.__META_PIXEL_INITIALIZED__ = true;
  window.__META_PIXEL_ID__ = pixelId;
  return true;
};

type StandardEvent =
  | 'PageView'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Subscribe'
  | 'ViewContent'
  | 'Search'
  | 'AddToCart'
  | 'Purchase'
  | 'Contact';

export const trackEvent = (event: StandardEvent, params?: Record<string, any>) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  try {
    window.fbq('track', event, params || {});
  } catch (e) {
    console.warn('[MetaPixel] track error', e);
  }
};

export const trackCustom = (event: string, params?: Record<string, any>) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  try {
    window.fbq('trackCustom', event, params || {});
  } catch (e) {
    console.warn('[MetaPixel] trackCustom error', e);
  }
};

export const trackPageView = () => trackEvent('PageView');
