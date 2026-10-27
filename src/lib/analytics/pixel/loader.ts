import { isBrowser, sha256, SCRIPT_ID } from './browser';

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
  window.fbq('set', 'autoConfig', true, id);
  window.fbq('init', id);
  window.fbq('track', 'PageView');

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
