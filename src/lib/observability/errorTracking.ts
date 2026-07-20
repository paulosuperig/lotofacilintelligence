/**
 * Camada de observabilidade agnóstica de provedor.
 *
 * Funciona hoje: captura erros de client (global handlers + ErrorBoundary),
 * emite logs estruturados (nível, timestamp, contexto, stack) e nunca registra
 * PII (email, tokens, senhas são removidos antes de sair).
 *
 * Pronta para produção: registre um forwarder (ex.: Sentry) via
 * `registerForwarder`. Para ativar Sentry, defina VITE_SENTRY_DSN e chame
 * `registerForwarder` com o adaptador — nenhum outro ponto do app muda.
 */

export type Severity = 'info' | 'warning' | 'error' | 'fatal';

export interface ErrorContext {
  /** Onde ocorreu (ex.: 'ErrorBoundary', 'useLottery.save'). */
  scope?: string;
  /** Dados extras já livres de PII. */
  extra?: Record<string, unknown>;
}

type Forwarder = (payload: StructuredEvent) => void;

interface StructuredEvent {
  level: Severity;
  message: string;
  timestamp: string;
  scope?: string;
  userId?: string;
  stack?: string;
  extra?: Record<string, unknown>;
}

const PII_KEYS = /^(email|e-?mail|password|senha|token|apikey|api_key|authorization|secret|cpf|phone|telefone|whatsapp)$/i;

let currentUserId: string | undefined;
let forwarder: Forwarder | null = null;
let initialized = false;

/** Remove chaves sensíveis de um objeto de contexto (raso + 1 nível). */
const scrub = (obj?: Record<string, unknown>): Record<string, unknown> | undefined => {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (PII_KEYS.test(k)) {
      out[k] = '[redacted]';
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = scrub(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
};

const emit = (event: StructuredEvent) => {
  const line = {
    ...event,
    extra: scrub(event.extra),
    userId: currentUserId,
  };
  // Log estruturado (JSON) — parseável por qualquer coletor de logs.
  const method = event.level === 'info' ? 'info' : event.level === 'warning' ? 'warn' : 'error';
  console[method]('[obs]', JSON.stringify(line));
  try {
    forwarder?.(line);
  } catch {
    /* um forwarder quebrado nunca deve derrubar o app */
  }
};

/** Associa o usuário atual (apenas UUID — jamais email/PII). */
export const setUser = (userId: string | null | undefined) => {
  currentUserId = userId ?? undefined;
};

export const clearUser = () => {
  currentUserId = undefined;
};

/** Plugue um provedor externo (Sentry, Datadog, etc.). */
export const registerForwarder = (fn: Forwarder) => {
  forwarder = fn;
};

export const captureException = (error: unknown, context: ErrorContext = {}) => {
  const err = error instanceof Error ? error : new Error(String(error));
  emit({
    level: 'error',
    message: err.message,
    timestamp: new Date().toISOString(),
    scope: context.scope,
    stack: err.stack,
    extra: context.extra,
  });
};

export const captureMessage = (
  message: string,
  level: Severity = 'info',
  context: ErrorContext = {},
) => {
  emit({
    level,
    message,
    timestamp: new Date().toISOString(),
    scope: context.scope,
    extra: context.extra,
  });
};

/** Instala handlers globais. Idempotente — seguro chamar uma vez no bootstrap. */
export const initErrorTracking = () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('error', (e) => {
    captureException(e.error ?? e.message, { scope: 'window.onerror' });
  });

  window.addEventListener('unhandledrejection', (e) => {
    captureException(e.reason, { scope: 'unhandledrejection' });
  });
};
