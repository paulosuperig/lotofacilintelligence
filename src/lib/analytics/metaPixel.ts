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

// Fachada de compatibilidade: implementação dividida em ./pixel (navegador, carregamento, eventos).
export { generateEventId, getPixelContext } from './pixel/browser';
export { initMetaPixel, setAdvancedMatching, clearAdvancedMatching } from './pixel/loader';
export { trackEvent, trackCustom, trackPageView, type StandardEvent, type BaseEventParams } from './pixel/events';
